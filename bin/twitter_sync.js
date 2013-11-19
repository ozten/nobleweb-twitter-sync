#!/usr/local/bin/node
var fs = require('fs');
var path = require('path');

var twitter = require('twitter');

var config = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../config/config.json')));

console.log('Twitter sync');

var twit = new twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: null,
    access_token_secret: null
});

twit.getUserTimeline({
    screen_name: 'ozten'
}, function(err, tweets, a, b) {
    console.log('err=', err);
    console.log('tweets=', tweets);
    console.log('a=', a, 'b=', b);
});

console.log(twit);