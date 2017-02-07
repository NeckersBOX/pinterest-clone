'use strict';

const Express = require ('express');
const fs = require ('fs');
const path = require ('path');
const Flutter = require ('flutter');
const session = require ('express-session');

const app = new Express ();

app.use (Express.static ('dist'));
app.use (session ({ secret: '$3cR3tC0d3R34lLy$&cR3t!' }));

const flutter = new Flutter ({
  cache: false,
  consumerKey: 'Cia3AnMi7dkhG7JBhrfOQ5Fos',
  consumerSecret: 'Tvji3GD9Zo8vIgLmNxXZOdqhtAxlORYeRbKI3vo23obl4gmWWQ',
  loginCallback: 'https://neckers-pinclone.herokuapp.com/twitter/callback',

  authCallback: (req, res) => {
    if ( req.error )
      return;

    const accessToken = req.session.oauthAccessToken;
    const secret = req.session.oauthAccessTokenSecret;

    // Store away oauth credentials here
    console.log ('accessToken: ' + accessToken, 'secret: ' + secret);
    // Redirect user back to your app
    res.redirect ('/');
  }
});

app.get('/twitter/connect', flutter.connect);
app.get('/twitter/callback', flutter.auth);

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
