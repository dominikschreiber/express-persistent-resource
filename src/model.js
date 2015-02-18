'use strict';

var _ = require('lodash');

exports.stringify = function(model) {
    return _.chain(model)
            .pairs()
            .map(function(keyValue) {
                if (keyValue[1] === true) {
                    return keyValue[0];
                } else {
                    return keyValue[0] + ':(' + exports.stringify(keyValue[1]) + ')';
                }
            })
            .join(',');
};

exports.validate = function(doc, model) {
    return doc;
};