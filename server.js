'use strict';

const Express = require ('express');
const fs = require ('fs');
const path = require ('path');
const passport = require ('passport');
const twitterStrategy = require ('passport-twitter').Strategy;

const app = new Express ();

app.use (Express.static ('dist'));

app.use (require ('morgan')('combined'));
app.use (require ('cookie-parser')());
app.use (require ('body-parser').urlencoded ({ extended: true }));

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

    cb (null, profileInfo);
  }
));

passport.serializeUser(function(user, cb) {
  console.log ('serializeUser', user);
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  console.log ('deserializeUser', obj);
  cb(null, obj);
});

app.use (passport.initialize ());
app.use (passport.session ());

app.get ('/auth/twitter', passport.authenticate ('twitter'));

app.get ('/auth/twitter/callback',
  passport.authenticate ('twitter', { successRedirect: '/', failureRedirect: '/not-found' }));

app.get ('/:page?', (req, res, next) => {
  let pageRequest = req.params.page ? path.basename (req.params.page, '.html') : 'index';

  fs.readFile ('dist/html/' + pageRequest + '.html', 'utf8', (err, data) => {
    if ( err ) {
      console.log (err);
      return next ();
    }

    res.writeHead (200, { 'Content-Type': 'text/html' });
    res.end (data);
  });
});

app.get ('*', (req, res) => {
  fs.readFile ('dist/html/not-found.html', 'utf8', (err, data) => {
    if ( err ) {
      res.status(500).send ('An empty space is around me.. I\'m feeling so lonely.');
      return;
    }

    res.writeHead (200, { 'Content-Type': 'text/html' });
    res.end (data);
  });
});

app.listen (process.env.PORT || 3000, err => {
  if ( err )
    return console.error (err);

  console.log ('Server running at http://localhost:' + (process.env.PORT || 3000));
});
