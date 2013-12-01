var path = require('path');

exports.dataDirectory = function () {
    return path.resolve(__dirname, '../data');
};