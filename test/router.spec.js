'use strict';

var assert = require('assert')
  , mock = {
        findAll: function(next) {
            next(null, [1,2,3]);
        },
        findById: function(id, next) {
            next(null, {id: id, content: 'foo'});
        },
        save: function(data, next) {
            next(null, data.id || 7);
        }
    }
  , router = require('../src/router')(mock, { view: 'test' });

describe('router', function() {
    describe('#error(res,err,next)', function() {
        it('should respond with a "500 internal server error" on errors', function(done) {
            var err = 'this is an error' // creating an error here would make mocha fail
              , res = {
                    status: function(code) {
                        assert.equal(500, code);
                        return res;
                    },
                    format: function(e) { e.json(); }, 
                    send: function(e) {
                        assert.equal(err, e);
                        return res;
                    }
                };
            router.error(res, err, function() {
                // mocha would fail when done being called with error
                // => make sure it is called without parameters
                done();
            });
        });
    });
    
    describe('#list(req,res,next)', function() {
        it('should respond with a list of urls relative to /', function(done) {
            router.list({
                get: function() { return 'application/json'; },
                baseUrl: '/api/v1/test'
            }, {
                format: function(e) { e.json(); },
                send: function(e) {
                    assert.deepEqual(['/api/v1/test/1','/api/v1/test/2','/api/v1/test/3'], e);
                }
            }, done);
        });
    });
    
    describe('#create(req,res,next)', function() {
        it('should respond with the url of the newly created entry', function(done) {
            router.create({
                get: function() { return 'application/json'; },
                body: {foo: 'bar'},
                baseUrl: '/api/v1/test'
            }, {
                format: function(e) { e.json(); },
                send: function(e) {
                    assert.equal('/api/v1/test/7', e);
                }
            }, done);
        });
    });
    
    describe('#read(req,res,next)', function() {
        it('should respond with the entry specified by id', function(done) {
            router.read({
                get: function() { return 'application/json'; },
                params: {id: 5}
            }, {
                format: function(e) { e.json(); },
                send: function(e) {
                    assert.deepEqual({id: 5, content: 'foo'}, e);
                }
            }, done);
        });
    });
    
    describe('#update(req,res,next)', function() {
        it('should respond with the url of the updated entry', function(done) {
            router.update({
                get: function() { return 'application/json'; },
                body: {goo: 'gle'},
                params: {id: 5},
                baseUrl: '/api/v1/test'
            }, {
                format: function(e) { e.json(); },
                send: function(e) {
                    assert.equal('/api/v1/test/5', e);
                }
            }, done);
        });
    });
});