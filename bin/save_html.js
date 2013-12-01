#!/usr/local/bin/node

var fs = require('fs');
var path = require('path');

var dataDirectory = require('../lib/storage').dataDirectory;

fs.readdir(dataDirectory(), function(err, files) {
    if (err) {
        throw new Error(err);
    }
    files.forEach(function(file) {
      if (file.indexOf('.json') !== -1) {
        fs.readFile(path.join(dataDirectory(), file), 'utf8', function(err, data) {
            if (err) {
                console.log('Error in ', file, err);
            } else {
                try {
                    var tweets = JSON.parse(data);
                    tweets.forEach(function(tweet) {
                        saveHtmlFor(tweet);
                    });
                } catch(e) {
                    console.log('Unable to parse JSON from ', file, e);
                }
            }
        });
      }
    });
});

function saveHtmlFor(tweet) {
    var tweetDate = new Date(Date.parse(tweet.created_at));
    console.log(Object.keys(tweet.user));
    console.log(tweet.user.screen_name, tweet.user.name);
    ensureDirectory(tweet.user.screen_name, tweetDate, function() {

    });
}

function ensureDirectory(username, aDate, cb) {
    console.log(aDate.getFullYear(), aDate.getMonth() + 1, aDate.getDay() + 1);
    var yearPath = path.join(dataDirectory, aDate.getFullYear();
    fs.mkdir(yearPath), function(err) {
        var monthPath = path.join(yearPath, aDate.getMonth();
        fs.mkdir(monthPath), function(err) {

        });
    });
}