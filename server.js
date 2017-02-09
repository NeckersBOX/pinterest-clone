'use strict';

const Express = require ('express');
const path = require ('path');
const passport = require ('passport');
const twitterStrategy = require ('passport-twitter').Strategy;
const MongoClient = require ('mongodb').MongoClient;
const co = require ('co');

const app = new Express ();

app.use (Express.static ('dist'));

app.use (require ('morgan')('combined'));
app.use (require ('cookie-parser')());
app.use (require ('body-parser').urlencoded ({ extended: true }));

app.set ('view engine', 'ejs');
app.set ('views', path.join (__dirname, 'src/views'));

app.use (require ('express-session')({
  secret: 'r34Lly$3cR3tC0d3',
  resave: true,
  saveUninitialized: true
}));

passport.use (new twitterStrategy (
  {
    consumerKey: 'zXhcaCoQVUfHdiCri4dHJYXzN',
    consumerSecret: '6RVO2uQX0yOmIbT9sWYLGAqAZeAR9WPlLTKrK1HRnAXuPXwyo4',
    callbackURL: '/auth/twitter/callback'
  },
  (accessToken, refreshToken, profile, cb) => {
    const profileInfo = {
      id_str: profile._json.id_str,
      screen_name: profile._json.screen_name,
      name: profile._json.name,
      image: profile._json.profile_image_url_https
    };

    co (function *() {
      const db = yield MongoClient.connect (process.env.mongoURI);
      const pinclone_users = db.collection ('pinclone_users');

      let doc = yield pinclone_users.findOne (profileInfo);
      if ( doc ) {
        db.close ();
        cb (null, profileInfo);
        return;
      }

      let result = yield pinclone_users.insertOne (profileInfo);

      db.close ();

      cb (null, profileInfo);
    }).catch (err => cb (err.stack, null));
  }
));

passport.serializeUser ((user, cb) => cb (null, user.id_str));

passport.deserializeUser((obj, cb) => {
  co (function *() {
    const db = yield MongoClient.connect (process.env.mongoURI);
    const pinclone_users = db.collection ('pinclone_users');

    let doc = yield pinclone_users.findOne ({ id_str: obj });
    db.close ();

    cb (null, doc);
  }).catch (err => cb (err.stack, null));
});

app.use (passport.initialize ());
app.use (passport.session ());

const isLoggedIn = (req, res, next) => req.isAuthenticated () ? next () : res.redirect ('/');

app.get ('/auth/twitter', passport.authenticate ('twitter'));

app.get ('/auth/twitter/callback', passport.authenticate ('twitter',
  {
    successRedirect: '/',
    failureRedirect: '/'
  }
));

app.get ('/auth/logout', (req, res) => {
  req.logout ();
  res.redirect ('/');
});

app.get (['/', '/index'], (req, res) => {
  let userImages = [];

  co (function *() {
    const db = yield MongoClient.connect (process.env.mongoURI);
    const pinclone_images = db.collection ('pinclone_images');

    userImages = yield pinclone_images.find ().toArray ();

    db.close ();

    res.render ('index', { auth_check: req.isAuthenticated (), userImages });
  }).catch (err => res.end (JSON.stringify ({ error: err.stack })));
});

app.get ('/mypin', isLoggedIn, (req, res) => {
  let userImages = [];

  co (function *() {
    const db = yield MongoClient.connect (process.env.mongoURI);
    const pinclone_images = db.collection ('pinclone_images');

    userImages = yield pinclone_images.find ({ 'user.id_str': req.user.id_str }).toArray ();
    db.close ();

    res.render ('mypin', { userImages });
  }).catch (err => res.end (JSON.stringify ({ error: err.stack })));
});

app.get ('/remove-image/:date', isLoggedIn, (req, res) => {
  co (function *() {
    const db = yield MongoClient.connect (process.env.mongoURI);
    const pinclone_images = db.collection ('pinclone_images');

    let result = yield pinclone_images.findOneAndDelete ({
      'user.id_str': req.user.id_str,
      'date': +req.params.date
    });

    db.close ();

    res.redirect ('/mypin');
  }).catch (err => res.end (JSON.stringify ({ error: err.stack })));
});

app.get ('/like/:user/:date', isLoggedIn, (req, res) => {
  co (function *() {
    const db = yield MongoClient.connect (process.env.mongoURI);
    const pinclone_images = db.collection ('pinclone_images');

    let doc = yield pinclone_images.findOne ({
      'date': +req.params.date,
      'user.id_str': req.params.user
    });

    if ( !doc ) {
      res.end (JSON.stringify ({ error: 'image not found' }));
      db.close ();
      return;
    }

    let result = yield pinclone_images.findOneAndUpdate (doc, { $set: { like: doc.like + 1 } });
    db.close ();

    res.end (JSON.stringify ({ like: doc.like + 1 }));
  }).catch (err => res.end (JSON.stringify ({ error: err.stack })));
});

app.get ('/addpin', isLoggedIn, (req, res) => res.render ('addpin'));

app.post ('/addpin', isLoggedIn, (req, res) => {
  co (function *() {
    const db = yield MongoClient.connect (process.env.mongoURI);
    const pinclone_images = db.collection ('pinclone_images');

    let result = yield pinclone_images.insertOne ({
      user: req.user,
      image: req.body.image.split ('').slice (0, 512).join (''),
      description: req.body.description.split ('').slice (0, 32).join (''),
      date: Date.now (),
      like: 0
    });

    db.close ();

    res.redirect ('/mypin');
  }).catch (err => res.end (JSON.stringify ({ error: err.stack })));
});

app.get ('*', (req, res) => res.render ('not-found'));

app.listen (process.env.PORT || 3000, err => {
  if ( err )
    return console.error (err);

  console.log ('Server running at http://localhost:' + (process.env.PORT || 3000));
});
