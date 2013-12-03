#!/usr/local/bin/node

var fs = require('fs');
var path = require('path');

var moment = require('moment');
var nunjucks = require('nunjucks');

var dataDirectory = require('../lib/storage').dataDirectory;
var linkify = require('../lib/linkify');
var rateLimit = require('../lib/rate_limit');

//nunjucks.configure('../templates');
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));

// Limit I/O operations
// TODO - it isn't really a rateLimit in time, but an absolute open work item
var limited = rateLimit(1, 150);

fs.readdir(dataDirectory(), function(err, files) {
    if (err) {
        throw new Error(err);
    }
    files.forEach(function(file) {
      if (file.indexOf('.json') !== -1) {
        limited(function() {
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
        });
      }
    });
});

function saveHtmlFor(tweet) {
    var tweetDate = new Date(Date.parse(tweet.created_at));
    //console.log(Object.keys(tweet.user));
    //console.log(tweet.user.screen_name, tweet.user.name);
    ensureDirectory(tweet.user.screen_name, tweetDate, function(err, dir) {
      if (err) {
        console.log(new Error(err));
      } else {

        normalizeTweet(tweet);
        env.render('tweet.html', tweet, function(err, html) {
            if (err) {
                console.log('ouch');
                console.error(new Error(err));
                return;
            }
            limited(function() {
                fs.writeFile(path.join(dir, tweet.id + '.html'), html, {
                    encoding: 'utf8',
                    flag: 'w'
                }, function(err) {
                    if (err) console.log(new Error(err));
                });
            });
        });
      }
    });
}

function ensureDirectory(username, aDate, cb) {
    console.log(aDate.getFullYear(), aDate.getMonth() + 1, aDate.getDay() + 1);
    var userDir = path.join(dataDirectory(), username);
    limited(function() {
        fs.mkdir(userDir, function(err) {
            if (actualError(err)) return cb(err);
            var yearPath = path.join(userDir, '' + aDate.getFullYear());
            //console.log('yearPath', yearPath);
            limited(function() {
                fs.mkdir(yearPath, function(err) {
                    if (actualError(err)) return cb(err);
                    var monthPath = path.join(yearPath, '' + (aDate.getMonth() + 1));
                    //console.log('monthPath=', monthPath);
                    limited(function() {
                        fs.mkdir(monthPath, function(err) {
                            if (actualError(err)) return cb(err);
                            var dayPath = path.join(monthPath, '' + (aDate.getDay() + 1));
                            console.log('Creating dayPath=', dayPath);
                            limited(function() {
                                fs.mkdir(dayPath, function(err) {
                                    if (! actualError(err)) {
                                        err = null;
                                    }
                                    cb(err, dayPath);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
    function actualError(err) {
        return err && 'EEXIST' !== err.code;
    }
}

function normalizeTweet(tweet) {
  tweet.html = linkify(tweet.text);
  tweet.display_date = moment(tweet.created_at).format('llll');
}