'use strict';

var _ = require('lodash');

exports.parse = function(fields) {
    return _.omit(JSON.parse(('(' + fields + ')')
                      .replace(/:/g, '":')
                      .replace(/\(/g, '{"')
                      .replace(/\)/g, '}')
                      .replace(/(\}+)/g, '":true$1')
                      .replace(/,/g, '":true,"')
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
                if (model[keyNested[0]] === true) {
                    return keyNested;
                } else {
                    return [keyNested[0], exports.validate(keyNested[1], model[keyNested[0]])];
                }
            })
            .reduce(function(accumulator, keyNested) {
                var obj = {};
                obj[keyNested[0]] = keyNested[1];
                return _.extend(accumulator, obj);
            }, {})
            .value();
};