#!/usr/bin/env node
var tap = require('tap');

var rateLimit = require('../lib/rate_limit');

tap.test("Hobos are cool", function(test) {
    var now = new Date().getTime();
    var counter = 0;
    var limited = rateLimit(3, 5);
    // First 5 go through
    limited(function() {
        counter++;
    });
    limited(function() {
        counter++;
    });
    limited(function() {
        counter++;
    });
    limited(function() {
        counter++;
    });
    limited(function() {
        counter++;
    });

    // 6
    limited(function() {
        counter++;
    });

    // 7
    limited(function() {
        counter++;
    });

    setTimeout(function() {
        test.equal(counter, 5, "Only the first 5 calls go through @" + new Date().getTime() - now);
    }, 100);

    setTimeout(function() {
        test.equal(counter, 7, "After 3 seconds, they all go through @" + new Date().getTime() - now);

    }, 4000);

    setTimeout(function() {
        // First 5 go through
        limited(function() {
            counter++;
        });
        limited(function() {
            counter++;
        });
        limited(function() {
            counter++;
        });
        limited(function() {
            counter++;
        });
        limited(function() {
            counter++;
        });
        // 6
        limited(function() {
            counter++;
        });

        // 7
        limited(function() {
            counter++;
        });

        setTimeout(function() {
            test.equal(counter, 14, "Only the first 5 calls go through @" + new Date().getTime() - now);
        }, 10000 + 100);

        setTimeout(function() {
            test.equal(counter, 19, "After 3 seconds, they all go through @" + new Date().getTime() - now);
            test.end();
        }, 10000 + 4000);
    }, 10000);
});