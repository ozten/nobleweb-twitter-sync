#!/usr/local/bin/node

/**
 * Run for a given user.
 * Run every hour via cron or something.
 */

// Rate limiting library

var fs = require('fs');
var path = require('path');

var twitter = require('twitter');

var rateLimit = require('../lib/rate_limit');
var dataDirectory = require('../lib/storage').dataDirectory;

var config = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../config/config.json')));

var userConfig;

const MAX_TWEETS_PER_PAGE = 200;
const MAX_TIMELINE_CALLS = 180;
const FIVETEEN_MIN = 15 * 60; // in seconds

var limited = rateLimit(FIVETEEN_MIN, MAX_TIMELINE_CALLS);

function fullSync(screenName, cb) {
    var twit = new twitter({
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        access_token_key: userConfig.oauth_token,
        access_token_secret: userConfig.oauth_token_secret
    });

    limited(function() {
        var params = {
            screen_name: screenName,
            count: MAX_TWEETS_PER_PAGE
        };
        twit.getUserTimeline(params, function(tweets) {


            var lowestId = findLowestId(tweets);
            var alreadySeen = alreadySeenID(lowestId);
            recordIDs(tweets);

            saveTweets(params, tweets);

            if (false === alreadySeen && lowestId > 0) {
                limited(function() {
                    fetchOldPage(twit, screenName, lowestId - 1, MAX_TWEETS_PER_PAGE, cb);
                });
            } else {
                if (alreadySeen) console.log('All caught up');
                cb();
            }
        });
    });
}

var allIds = {};

/**
 * If there are no lower ids (because results were empty)
 * code returns -1
 */
function findLowestId(tweets) {
    var lowest = -1;
    if (!tweets.forEach) {
        return lowest;
    }
    tweets.forEach(function(tweet) {

        if (lowest === -1 || tweet.id < lowest) {
            lowest = tweet.id;
        }
    });
    return lowest;
}

/**
 * If there are no lower ids (because results were empty)
 * code returns -1
 */
function findHighestId(tweets) {
    var highest = -1;
    if (!tweets.forEach) {
        return lowest;
    }
    tweets.forEach(function(tweet) {
        if (highest === -1 || tweet.id > highest) {
            highest = tweet.id;
        }
    });
    return highest;
}

function recordIDs(tweets) {
    tweets.forEach(function(tweet) {
        allIds['' + tweet.id] = true;
    });
}

function alreadySeenID(id) {
    return allIds['' + id] === true;
}

function saveTweets(params, tweets) {
    var start = params.max_id || 'start';
    var filename = params.screen_name + '_' + start + '.json';
    fs.writeFile(path.join(dataDirectory(), filename), JSON.stringify(tweets, null, 4), 'utf8');
}

function fetchOldPage(twit, screenName, maxId, count, cb) {
    var params = {
        screen_name: screenName,
        max_id: maxId,
        count: count
    };
    twit.getUserTimeline(params, function(tweets) {
        var lowestId = findLowestId(tweets);
        var alreadySeen = alreadySeenID(lowestId);
        recordIDs(tweets);

        saveTweets(params, tweets);

        if (false === alreadySeen && lowestId > 0) {
            limited(function() {
                fetchOldPage(twit, screenName, lowestId - 1, MAX_TWEETS_PER_PAGE, cb);
            });
        } else {
            if (alreadySeen) console.log('All caught up now');
            cb();
        }
    });
}



var screenName = 'ozten';

/**
 * Examine the file system and figure out the most recent
 * tweet ID we have on file.
 */
function maxIdOnDisk(screenName, cb) {
    var maxId = -1;

    fs.readdir(dataDirectory(), function(err, files) {
        if (err) throw new Error(err);
        files.forEach(function(file) {
            var filePath = path.join(dataDirectory(), file);
            var stat = fs.statSync(filePath);
            if (file.indexOf(screenName) === 0 && stat.isFile()) {
                var data = fs.readFileSync(filePath, 'utf8');

                var tweets = JSON.parse(data);
                recordIDs(tweets);
                var highest = findHighestId(tweets);
                if (maxId === -1 || highest > maxId) {
                    maxId = highest;
                }
            }
        });
        cb(maxId);
    });
}

fs.readFile(path.resolve(__dirname, '..', 'config', screenName + '.json'),
    function(err, c) {
        if (err) {
            console.log('Please visit http://127.0.0.1:3000/auth/twitter/ and authorize this app');
        } else {
            try {
                // TODO - get ride of this global
                userConfig = JSON.parse(c);
                maxIdOnDisk(screenName, function(previousMaxId) {
                    fullSync(screenName, function() {
                        console.log('Finished fullSync');
                    });
                });
            } catch (e) {
                console.error(e);
                console.log('Please visit http://127.0.0.1:3000/auth/twitter/ and authorize this app');
            }
        }
    });