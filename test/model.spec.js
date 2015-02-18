'use strict';

var assert = require('assert')
  , _ = require('lodash')
  , model = require('../src/model');

describe('model', function() {
    describe('stringify', function() {
        var tests = {
            '': {},
            'id,snippet': {id:true, snippet:true},
            'id,snippet:(title,name)': {id:true, snippet:{title:true, name:true}},
            'foo:(bar,baz:(goo,gle)),hoo:(ray)': {foo:{bar:true, baz:{goo:true, gle:true}}, hoo:{ray: true}}
        };
        
        _.each(_.pairs(tests), function(expectedFor) {
            it('should create "' + expectedFor[0] + '" for ' + JSON.stringify(expectedFor[1]), function() {
                assert.equal(expectedFor[0], model.stringify(expectedFor[1]));
            });
        });
    });
});