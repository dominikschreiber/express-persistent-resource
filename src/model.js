'use strict';

var _ = require('lodash');

exports.parse = function(fields) {
    return _.omit(JSON.parse(('(' + fields + ')')
                      .replace(/:/g, '":')
                      .replace(/\(/g, '{"')
                      .replace(/\)/g, '}')
                      .replace(/(\}+)/g, '":true$1')
                      .replace(/([^\}]),/g, '$1":true,"')
                      .replace(/\},/g, '},"')
                      .replace(/([^\}])$/g, '$1"')), '');
};

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
    return _.chain(doc)
            .pick(_.keys(model))
            .pairs()
            .map(function(keyNested) {
                var key = keyNested[0]
                  , nested = keyNested[1];
        
                if (model[key] === true) {
                    return keyNested;
                } else {
                    if (_.isArray(nested)) {
                        return [key, _.map(nested, function(elem) { return exports.validate(elem, model[key]); })];
                    } else {
                        return [key, exports.validate(nested, model[key])];
                    }
                }
            })
            .reduce(function(accumulator, keyNested) {
                var obj = {};
                obj[keyNested[0]] = keyNested[1];
                return _.extend(accumulator, obj);
            }, {})
            .value();
};