'use strict';

var assert = require('assert')
  , _ = require('lodash')
  , model = require('../src/model');

function multitest(tests, should, actual) {
    _.each(_.pairs(tests), function(test) {
         it('should ' + should(test), function() {
             assert.equal(test[0], actual(test[1]));
         });
    });
}

describe('model', function() {
    describe('#parse(fields)', function() {
        multitest({
            '{}': '',
            '{"id":true,"snippet":true}': 'id,snippet',
            '{"id":true,"snippet":{"title":true,"name":true}}': 'id,snippet:(title,name)',
            '{"foo":{"bar":{"baz":{"goo":true,"gle":true}}}}': 'foo:(bar:(baz:(goo,gle)))'
        }, function(test) {
            return 'parse ' + test[0] + ' from ' + test[1];
        }, function(input) {
            return JSON.stringify(model.parse(input));
        });
    });
    
    describe('#stringify(model)', function() {
        multitest({
            '': {},
            'id,snippet': {id:true, snippet:true},
            'id,snippet:(title,name)': {id:true, snippet:{title:true, name:true}},
            'foo:(bar,baz:(goo,gle)),hoo:(ray)': {foo:{bar:true, baz:{goo:true, gle:true}}, hoo:{ray: true}}
        }, function(test) {
            return 'create "' + test[0] + '" for ' + JSON.stringify(test[1]);
        }, function(input) {
            return model.stringify(input);
        });
    });
    
    describe('#validate(doc,model)', function() {
        multitest({
            '{}': {
                doc: {},
                model: {}
            },
            '{"id":5,"snippet":"foo"}': {
                doc: {id: 5, snippet: 'foo', title: 'bar'},
                model: {id:true, snippet:true}
            },
            '{"id":5,"snippet":"foo","name":{"firstname":"foo","lastname":"bar"}}': {
                doc: {id: 5, snippet: 'foo', name: {firstname: 'foo', lastname: 'bar'}, glob: 'al', sh: {it: true}},
                model: {id:true, snippet:true, name: {firstname:true, lastname:true}}
            },
            '{"id":5,"history":[{"timestamp":"0815","event":"none"},{"timestamp":"1337","event":"all"}]}': {
                doc: {id: 5, history: [{timestamp: '0815', event: 'none'}, {timestamp: '1337', event: 'all'}]},
                model: {id:true, history: {timestamp:true, event:true}}
            }
        }, function(test) {
            return 'return ' + test[0] + ' when validating\n\t\t' + JSON.stringify(test[1].doc) + ' against\n\t\t' + model.stringify(test[1].model);
        }, function(input) {
            return JSON.stringify(model.validate(input.doc, input.model));
        });
    });
});