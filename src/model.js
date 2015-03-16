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

exports.filter = function(docs, filters) {
    var parsedFilters;
    
    if (!filters) {
        return docs;
    } else {
        parsedFilters = _.map(filters, function(filter) {
            return _.extend(filter, {property: exports.parse(filter.property)});
        });
    }

    return _.filter(docs, matchesAllFilters(parsedFilters));
};

function matchesAllFilters(filters) {
    return function(doc) {
        return _.every(filters, matchesFilter(doc));
    };
}

function matchesFilter(doc) {
    return function matches(filter) {
        var key
          , prop;
        
        if (typeof filter.property === 'string') {
            return exports.matches(doc, filter);
        } else {
            key = _.keys(filter.property)[0];
            prop = filter.property[key];
            
            if (prop === true) {
                return exports.matches(doc, _.extend(filter, { property: key }));
            } else {
                return matchesFilter(doc[key])(_.extend(filter, { property: prop }));
            }
        }
    };
}

exports.matches = function(doc, filter) {
    var prop = doc[filter.property]
      , val = filter.filter;

    switch (filter.match) {
        case '=':
            return prop === val;
        case '~':
            return val.split(',').indexOf(prop) > -1;
        case '|':
            return prop === val
                || prop.indexOf(val + '-') === 0;
        case '*':
            return prop.indexOf(val) > -1;
        case '^':
            return prop.indexOf(val) === 0;
        case '$':
            return prop.indexOf(val, prop.length - val.length) !== -1;
        default:
            return false;
    }
};