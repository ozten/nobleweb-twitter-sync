#!/usr/bin/env node
var tap = require('tap');

var rateLimit = require('../lib/rate_limit');

tap.test("Hobos are cool", function(test) {
    var now = new Date().getTime();
    var counter = 0;

    // 5 calls every 3 seconds
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
    }, 0);

    setTimeout(function() {
        test.ok(7 >= counter && counter > 5,
            "After 3 seconds, they all go through @" + new Date().getTime() - now);

    }, 3000);

    setTimeout(function() {
        counter = 0;
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
            test.equal(counter, 6, "Only the first 5 calls (plus the first one which resets the time period) goes through @" + new Date().getTime() - now);
        }, 0);

        setTimeout(function() {
            test.ok(7 >= counter && counter > 5, "After 3 seconds, they all go through @" + new Date().getTime() - now);
            test.end();
        }, 4000);
    }, 10000);
});