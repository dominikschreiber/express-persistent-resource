'use strict';

var assert = require('assert')
  , _ = require('lodash')
  , model = require('../src/model');

describe('model', function() {
    describe('#stringify(model)', function() {
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
    
    describe('#validate(doc,model)', function() {
        var tests = {
            '{"id":5,"snippet":"foo"}': {
                doc: {id: 5, snippet: 'foo', title: 'bar'},
                model: {id:true, snippet:true}
            },
            '{"id":5,"snippet":"foo","name":{"firstname":"foo","lastname":"bar"}}': {
                doc: {id: 5, snippet: 'foo', name: {firstname: 'foo', lastname: 'bar'}, glob: 'al', sh: {it: true}},
                model: {id: true, snippet:true, name:{firstname:true, lastname:true}}
            }
        };
        
        _.each(_.pairs(tests), function(expectedFor) {
            it('should return ' + expectedFor[0] + ' when validating\n\t\t' + JSON.stringify(expectedFor[1].doc) + ' against\n\t\t' + model.stringify(expectedFor[1].model), function() {
                assert.equal(expectedFor[0], JSON.stringify(model.validate(expectedFor[1].doc, expectedFor[1].model)));
            });
        });
    });
});