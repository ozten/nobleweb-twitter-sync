var fs = require('fs');
var path = require('path');

var express = require('express');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter');

var config = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../config/config.json')));

var express = require('express');
var app = express();

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy({
        consumerKey: config.consumer_key,
        consumerSecret: config.consumer_secret,
        callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {

        var userConfig = path.resolve(__dirname, '..', 'config', profile.username + '.json');
        fs.writeFile(userConfig, JSON.stringify({
            oauth_token: token,
            oauth_token_secret: tokenSecret
        }), 'utf8', function(err) {

            console.log('token', token);
            console.log('tokenSecret', tokenSecret);
            console.log('profile', profile);
            if (err) console.log(err);
            done(null, profile);
        });
    }));

app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({
    secret: config.session_secret
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);



app.get('/auth/twitter',
    passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

app.listen(3000);
console.log('Listening on port 3000');