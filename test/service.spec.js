'use strict';

var assert = require('assert')
  , _ = require('lodash')
  , resource = 'resource'
  , resources = [
        {_id: resource + '-1', _rev: '1', name: '1', nested: {foo: 'nested-1', bar: 'nested-2'}},
        {_id: resource + '-2', _rev: '1', name: '2', nested: {foo: 'nested-3', bar: 'nested-4'}},
        {_id: resource + '-3', _rev: '1', name: '3', nested: {foo: 'nested-5', bar: 'nested-6'}}
    ]
  , mock = {
        get: function(id, next) {
            if (id === '_design/' + resource) {
                next();
            } else if (_.contains(_.pluck(resources, '_id'), id)) {
                next(null, _.filter(resources, function(r) { return r._id === id; })[0]);
            } else {
                next(new Error('no doc with id ' + id));
            }
        },
        insert: function(data, id, next) {
            if (id === '_design/' + resource) {
                if (next !== undefined) {
                    next();
                }
            } else if (id === '4') {
                resources.push(_.extend(data, { _rev: '1' }));
                next(null, '4');
            } else {
                next(new Error('no doc with id ' + id));
            }
        },
        view: function(doc, view, paramsOrNext, maybeNext) {
            var next = (maybeNext === undefined) ? paramsOrNext : maybeNext
              , params = (maybeNext === undefined) ? undefined : paramsOrNext;
            
            if (doc === resource) {
                if (view === 'findAll') {
                    if (params === undefined) {
                        next(null, {rows: _.map(resources, function(r) {return {value: r}; })});
                    } else {
                        if (params.key !== undefined) {
                            next(null, {
                                rows: _.chain(resources)
                                        .filter(function(r) { return r.id === params.key; })
                                        .map(function(r) { return {value: r}; })
                                        .value()
                            });
                        } else {
                            next(new Error('unknown params ' + JSON.stringify(params)));
                        }
                    }
                } else {
                    next(new Error('no view ' + view));
                }
            } else {
                next(new Error('wrong resource name'));
            }
        }
    }
  , lastId = 0
  , options = {
        view: resource,
        fields: 'name',
        id: function() { lastId += 1; return lastId; }
    }
  , service = require('../src/service')(mock, options);

describe('service', function() {
    describe('#find()', function() {
        it('should return all public ids when called with shouldIncludeDocs=false', function() {
            service.find({
                shouldIncludeDocs: false
            }, function(err, result) {
                if (!err) {
                    assert.deepEqual(['1', '2', '3'], result);
                }
            }); 
        });
        
        it('should return all docs when called with shouldIncludeDocs=true', function() {
            service.find({
                shouldIncludeDocs: true
            }, function(err, result) {
                if (!err) {
                    assert.deepEqual(_.map(resources, function(r) {
                        return _.extend({id: r._id.slice(r._id.indexOf('-') + 1)}, _.omit(r, ['_id', '_rev']))
                    }), result);
                } 
            });
        });
        
        it('should return exact matched public ids when called with <field>=<value>', function() {
            service.find({
                shouldIncludeDocs: false,
                filters: [{
                    property: 'name',
                    match: '=',
                    filter: '1'
                }]
            }, function(err, result) {
                if (!err) {
                    assert.deepEqual(['1'], result);
                }
            });
        });
        
        it('should return a result subset when called with fields=<fields>', function() {
            service.find({
                shouldIncludeDocs: true,
                fields: 'name'
            }, function(err, result) {
                if (!err) {
                    assert.deepEqual(_.map(resources, function(r) { return {name: r.name}; }), result);
                }
            });
        });
        
        it('should return a result subset when called with fields=<fields> where <fields> is nested', function() {
            service.find({
                shouldIncludeDocs: true,
                fields: 'nested:(foo,bar)'
            }, function(err, result) {
                if (!err) {
                    assert.deepEqual(_.map(resources, function(r) {
                        return {nested: {foo: r.nested.foo, bar: r.nested.bar}};
                    }), result);
                }
            });
        });
        
        it('should return the doc specified by id', function() {
            service.find({id: '1'}, function(err, result) {
                if (!err) {
                    assert.equal({id: '1', name: '1'}, result);
                } 
            });
        });
    });
    
    describe('#save()', function() {
        it('should create a new id if entry is not already in database', function() {
            service.save({name: '4'}, function(err, result) {
                if (!err) {
                    assert.deepEqual('4', result);
                } 
            });
        });
        
        it('should update a doc if id is already in database', function() {
            service.save({id: '4', name: '5'}, function(err) {
                if (!err) {
                    assert.deepEqual('5', _.filter(resources, function(r) { return r._id === 'resource-4'; })[0].name);
                } 
            });
        });
    });
    
    describe('#delete()', function() {
        it('should set the doc specified by id to _deleted=true', function() {
            service.delete('3', function(err) {
                if (!err) {
                    assert.equal(true, _.filter(resources, function(r) { return r._id === 'resource-3'; })[0]._deleted);
                } 
            });
        });
    });
});