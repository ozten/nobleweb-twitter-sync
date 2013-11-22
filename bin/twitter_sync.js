#!/usr/local/bin/node

/**
 * Run for a given user
 */

// Rate limiting library

var fs = require('fs');
var path = require('path');

var twitter = require('twitter');

var rateLimit = require('../lib/rate_limit');

var config = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../config/config.json')));

const MAX_TWEETS_PER_PAGE = 200;
const MAX_TIMELINE_CALLS = 180;
const FIVETEEN_MIN = 15 * 60; // in seconds

var twit = new twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: null,
    access_token_secret: null
});

var limited = rateLimit(FIVETEEN_MIN, MAX_TIMELINE_CALLS);

function fullSync(screenName) {
    limited(function() {
        var params = {
            screen_name: screenName
        };
        // Full Sync
        twit.getUserTimeline(params, function(tweets) {
            saveTweets(params, tweets);
            console.log('tweets=', tweets);
            var lowestId = findLowestId(tweets);
            if (lowestId > 0) {
                limited(function() {
                    fetchPage(screenName, lowestId - 1, MAX_TWEETS_PER_PAGE);
                });
            }
        });
    });
}

/**
 * If there are no lower ids (because results were empty)
 * code returns -1
 */
function findLowestId(tweets) {
    var lowest = -1;

    tweets.forEach(function(tweet) {
        if (lowest === -1 || tweet.id < lowest) {
            lowest = tweet.id;
        }
    });
    console.log('Lowest Tweet ID seen is', lowest);
    return lowest;
}

function saveTweets(params, tweets) {
    var start = params.max_id || 'start';
    var filename = params.screen_name + '_' + start + '.json';
    fs.writeFile(filename, JSON.stringify(tweets, null, 4), 'utf8');
}

function fetchPage(screenName, maxId, count) {
    var params = {
        screen_name: screenName,
        max_id: maxId,
        count: count
    };
    twit.getUserTimeline(params, function(tweets) {

        saveTweets(params, tweets);

        var lowestId = findLowestId(tweets);

        if (lowestId > 0) {
            limited(function() {
                fetchPage(screenName, lowestId - 1, MAX_TWEETS_PER_PAGE);
            });
        }
    });
}
fullSync('ozten');