'use strict';

var assert = require('assert')
  , _ = require('lodash')
  , resource = 'test'
  , baseurl = '/api/v1/' + resource
  , model = 'name'
  , resources = [{id:1,name:'foo'}, {id:2,name:'bar'}, {id:3,name:'baz'}]
  , mock = {
        findAll: function(shouldIncludeDocs, next) {
            if (shouldIncludeDocs) {
                next(null, resources);
            } else {
                next(null, _.pluck(resources, 'id'));
            }
        },
        findById: function(id, next) {
            next(null, _.filter(resources, function(r) { return r.id === id; })[0] || {id: id, name: 'foo'});
        },
        filter: function(shouldIncludeDocs, filters, next) {
            var filtered = _.filter(resources, function(r) { return _.every(filters, function(f) { return r[f.property] == f.filter; }); });
            next(null, (shouldIncludeDocs) ? filtered : _.map(filtered, function(f) { return f.id; }));
        },
        save: function(data, next) {
            next(null, data.id || 7);
        }
    }
  , router = require('../src/router')(mock, { view: resource, fields: model });

function withJsonFormatter(res) {
    return _.extend(res, { format: function(e) { e.json(); } });
}

function withCommonProperties(req) {
    return _.extend(req, {
        baseUrl: baseurl,
        get: function() { return 'application/json'; }
    });
}

function resourceToUrl(resource) {
    return baseurl + '/' + resource.id;
}

describe('router', function() {
    describe('#error(res,err,next)', function() {
        it('should respond with a "500 internal server error" on errors', function(done) {
            var err = 'this is an error' // creating an error here would make mocha fail
              , res = withJsonFormatter({
                    status: function(code) {
                        assert.equal(500, code);
                        return res;
                    },
                    json: function(e) {
                        assert.equal(err, e);
                        return res;
                    }
                });
            
            router.error(res, err, function() {
                // mocha would fail when done being called with error
                // => make sure it is called without parameters
                done();
            });
        });
    });
    
    describe('#list(req,res,next)', function() {
        it('should respond with a list of urls relative to /', function(done) {
            var req = withCommonProperties({})
              , res = withJsonFormatter({
                    json: function(e) {
                        assert.deepEqual(_.map(resources, resourceToUrl), e);
                    }
                });
            
            router.list(req, res, done);
        });
        
        it('should respond with a list of docs when ?include_docs is set', function(done) {
            var req = withCommonProperties({
                    query: {include_docs: true}
                })
              , res = withJsonFormatter({
                    json: function(e) {
                        assert.deepEqual(resources, e);
                    }
                });
            
            router.list(req, res, done);
        });
        
        it('should respond with a exact-match filtered list when ?<field>=<filter> is set', function(done) {
            var req = withCommonProperties({
                    query: {name: 'foo'}
                })
              , res = withJsonFormatter({
                    json: function(e) {
                        assert.deepEqual(_.chain(resources)
                                         .filter(function(r) { return r.name === 'foo'; })
                                         .map(resourceToUrl)
                                         .value(), e);
                    }  
                });
            
            router.list(req, res, done);
        });
    });
    
    describe('#create(req,res,next)', function() {
        it('should respond with the url of the newly created entry', function(done) {
            var req = withCommonProperties({
                    body: {foo: 'bar'}
                })
              , res = withJsonFormatter({
                    json: function(e) {
                        assert.equal(baseurl + '/7', e);
                    }
                });
            
            router.create(req, res, done);
        });
    });
    
    describe('#read(req,res,next)', function() {
        it('should respond with the entry specified by id', function(done) {
            var req = withCommonProperties({
                    params: {id: 5}
                })
              , res = withJsonFormatter({
                    json: function(e) {
                        assert.deepEqual({id: 5, name: 'foo'}, e);
                    }
                });
            
            router.read(req, res, done);
        });
    });
    
    describe('#update(req,res,next)', function() {
        it('should respond with the url of the updated entry', function(done) {
            var req = withCommonProperties({
                    body: {goo: 'gle'},
                    params: {id: 5}
                })
              , res = withJsonFormatter({
                    json: function(e) {
                        assert.equal(baseurl + '/5', e);
                    }
                });
            
            router.update(req, res, done);
        });
    });
});