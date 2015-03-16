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
            '{"foo":{"bar":{"baz":{"goo":{"gle":{"is":{"no":{"evil":true}}}}}}}}': 'foo:(bar:(baz:(goo:(gle:(is:(no:(evil)))))))',
            '{"foo":{"goo":true,"gle":true},"bar":{"is":true,"no":true},"baz":{"evil":true,"thing":true}}': 'foo:(goo,gle),bar:(is,no),baz:(evil,thing)'
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
            return 'return ' + test[0] + ' when validating ' + JSON.stringify(test[1].doc) + ' against ' + model.stringify(test[1].model);
        }, function(input) {
            return JSON.stringify(model.validate(input.doc, input.model));
        });
    });
    
    describe('#matches(doc,filter)', function() {
        it('should treat = as exact match', function() {
            var matching = {name: 'foo'}
              , notMatching = {name: 'bar'}
              , filter = {property: 'name', match: '=', filter: 'foo'};
            
            assert.ok(model.matches(matching, filter));
            assert.ok(!model.matches(notMatching, filter));
        });
        
        it('should treat ~= as one of match', function() {
            var matching = {name: 'foo'}
              , alsoMatching = {name: 'bar'}
              , notMatching = {name: 'baz'}
              , filter = {property: 'name', match: '~', filter: 'foo,bar'};
            
            assert.ok(model.matches(matching, filter));
            assert.ok(model.matches(alsoMatching, filter));
            assert.ok(!model.matches(notMatching, filter));
        });
        
        it('should treat |= as exact/startswith match', function() {
            var matching = {name: 'foo'}
              , alsoMatching = {name: 'foo-bar'}
              , notMatching = {name: 'bar'}
              , filter = {property: 'name', match: '|', filter: 'foo'};
            
            assert.ok(model.matches(matching, filter));
            assert.ok(model.matches(alsoMatching, filter));
            assert.ok(!model.matches(notMatching, filter));
        });
        
        it('should treat *= as contains match', function() {
            var matching = {name: 'foobar'}
              , alsoMatching = {name: 'foobarbaz'}
              , notMatching = {name: 'googargaz'}
              , filter = {property: 'name', match: '*', filter: 'bar'};
            
            assert.ok(model.matches(matching, filter));
            assert.ok(model.matches(alsoMatching, filter));
            assert.ok(!model.matches(notMatching, filter));
        });
        
        it('should treat ^= as startswith match', function() {
            var matching = {name: 'foo'}
              , alsoMatching = {name: 'furz'}
              , notMatching = {name: 'goo'}
              , filter = {property: 'name', match: '^', filter: 'f'};
            
            assert.ok(model.matches(matching, filter));
            assert.ok(model.matches(alsoMatching, filter));
            assert.ok(!model.matches(notMatching, filter));
        });
        
        it('should treat $= as endwith match', function() {
            var matching = {name: 'foobar'}
              , alsoMatching = {name: 'barbar'}
              , notMatching = {name: 'foo'}
              , filter = {property: 'name', match: '$', filter: 'bar'};
            
            assert.ok(model.matches(matching, filter));
            assert.ok(model.matches(alsoMatching, filter));
            assert.ok(!model.matches(notMatching, filter));
        });
    });
});