'use strict';

const Express = require ('express');
const fs = require ('fs');
const path = require ('path');
const passport = require ('passport');
const twitterStrategy = require ('passport-twitter').Strategy;

const app = new Express ();

app.use (Express.static ('dist'));

passport.use (new twitterStrategy (
  {
    consumerKey: 'zXhcaCoQVUfHdiCri4dHJYXzN',
    consumerSecret: '6RVO2uQX0yOmIbT9sWYLGAqAZeAR9WPlLTKrK1HRnAXuPXwyo4',
    callbackURL: '/auth/twitter/callback'
  },
  (accessToken, refreshToken, profile, cb) => {
    console.warn ('profile', profile);
  }
));

app.get ('/auth/twitter', passport.authenticate ('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate ('twitter', { failureRedirect: '/not-found' }),
  (req, res) => {
    res.redirect('/');
  }
);

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
