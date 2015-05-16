'use strict';

module.exports = function(service, options) {
    var _ = require('lodash')
      , configuration = _.defaults(options, {
            view: '',
            fields: ''
        })
      , EasyXml = require('easyxml')
      , xml = new EasyXml({
            singularizeChildren: true,
            allowAttributes: true,
            manifest: true,
            rootElement: configuration.view
        })
      , model = require('untyped')
      , router = {};
    
    (function init() {
        if (typeof configuration.fields === 'string') {
            configuration.fields = model.parse(configuration.fields);
        }
    })();
    
    function format(res, json) {
        return {
            xml: function() {
                res.send(xml.render(json));
            },
            json: function() {
                res.json(json);
            },
            default: function() {
                res.json(json);
            }
        };
    }
    
    router.error = function(res, err, next) {
        res.status(500);
        res.format(format(res, err));
        next(err);
    };
    
    /**
     * lists all entries managed by service,
     * as urls to the entries, e.g.
     * 
     * ['/api/v1/foo/1', '/api/v1/foo/2']
     *
     * if ?include_docs is set, lists whole docs instead, e.g.
     *
     * [{id:1,name:'foo'}, {id:2,name:'bar'}]
     */
    router.list = function(req, res, next) {
        var shouldIncludeDocs = req.query && req.query.include_docs !== undefined
          , filters = (req.query) ? getFilters(req.query) : undefined
          , fields = (req.query) ? req.query.fields : undefined;
        
        service.find({
            shouldIncludeDocs: shouldIncludeDocs,
            filters: (_.isEmpty(filters)) ? undefined : filters,
            fields: fields,
            id: false
        }, handleListResult(shouldIncludeDocs, req, res, next));
    };
    
    function handleListResult(shouldIncludeDocs, req, res, next) {
        return function(err, result) {
            var message;
            if (err) {
                router.error(res, err, next);
            } else {
                if (shouldIncludeDocs) {
                    message = result;
                } else {
                    message = _.map(result, function(id) { return basePath(req, id); });
                }
                res.format(format(res, message));
                next();
            }
        };
    }
    
    function getFilters(query) {
        return _.chain(query)
            .pairs()
            .map(function(param) {
                return {
                    property: param[0],
                    match: '=',
                    filter: param[1]
                };
            })
            .union(_.chain(query)
                    .pairs()
                    .map(function(param) {
                        return {
                            property: param[0].slice(0,-1),
                            match: param[0].slice(-1),
                            filter: param[1]
                        };
                    })
                    .value())
            .filter(function(filter) {
                return filter.property.length > 0
                    && filter.filter !== ''
                    && !_.isEmpty(model.validate(model.parse(filter.property), configuration.fields));
            })
            .value();
    }
    
    function basePath(req, id) {
        return [req.baseUrl, id].join('/');
    }
    
    /**
     * reads the resource specified by req.params.id
     */
    router.read = function(req, res, next) {
        var options = {
            id: req.params.id
        };
        if (req.query && req.query.fields) {
            options.fields = req.query.fields;
        }
        
        service.find(options, function(err, result) {
            var message;
            if (err) {
                router.error(res, err, next);
            } else {
                message = result;
                res.format(format(res, message));
                next();
            }
        });
    };
    
    /**
     * creates the resource specified in req.body,
     * responds with the url of that newly created resource
     */
    router.create = function(req, res, next) {
        save(req.body, req, res, next);
    };
    
    function save(body, req, res, next) {
        service.save(body, function(err, id) {
            var message;
            if (err) {
                router.error(res, err, next);
            } else {
                message = basePath(req, id);
                res.format(format(res, message));
                next();
            }
        });
    }
    
    /**
     * updates the resource req.params.id with the content of req.body,
     * responds with the url of the updated resource
     */
    router.update = function(req, res, next) {
        save(_.extend(req.body, {id: req.params.id}), req, res, next);
    };
    
    /**
     * deletes the resource req.params.id,
     * responds with 200 + mount point
     */
    router.delete = function(req, res, next) {
        service.delete(req.params.id, function(err) {
            var message;
            if (err) {
                router.error(res, err, next);
            } else {
                message = req.baseUrl;
                res.format(format(res, message));
                next();
            }
        });
    };
    
    return router;
};