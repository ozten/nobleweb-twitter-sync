/**
 * Rate limit calls to the output of this function.
 *
 * Basic Usage:
 *    var rateLimit = require('rate_limit');
 *
 *    var fifteyEvery15Min = rateLimit(900, 50);
 *    fifteyEvery15Min(function() {
 *        doSomeWork();
 *    });
 *    fifteyEvery15Min(function() {
 *        doSomeMoreWork();
 *    });
 *
 *    var fifteyEvery15Min = rateLimit(900, 50);
 *
 * Callers should manage how they call this.
 * If you want calls per user for example, you'd
 * create a map of instances of these to usernames.
 *
 * @param integer - time in seconds that is the rate limit period.
 *     Examaple: 900 would be 15 minutes
 * @param integer - maximum number of calls allowed in period
 * @return function - A function which accepts a function for queueing up
 *   that function to run in a rate limited manner. See Basic Usage.
 */
module.exports = function(period, max) {
  var start = new Date().getTime();
  var nextPeriod =  start + (period * 1000);
  var counter = 0;
  var queue = [];

  function evaluateQueue() {
      if (nextPeriod < new Date()) {
          start = nextPeriod;
          counter = 0;
      }
      while (0 < queue.length && counter < max) {
        queue.pop()();
        counter++;
        // setTimeout again?
      }
  }

  return function(work) {
    // naive - increment counter, check max, sleep until counter is reset
    evaluateQueue();
    if (counter < max) {
        work();
        counter++;
    } else {
        queue.push(work);
        setTimeout(function() {
            evaluateQueue();
        }, nextPeriod - new Date().getTime());
    }
  };
};