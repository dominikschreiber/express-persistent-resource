'use strict';

module.exports = function(service, options) {
    var _ = require('lodash')
      , configuration = _.defaults(options, {
            view: ''
        })
      , EasyXml = require('easyxml')
      , xml = new EasyXml({
            singularizeChildren: true,
            allowAttributes: true,
            manifest: true,
            rootElement: configuration.view
        })
      , router = {};
    
    function format(res, json) {
        return {
            xml: function() {
                res.send(xml.render(json));
            },
            json: function() {
                res.send(json);
            },
            default: function() {
                res.send(json);
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
     */
    router.list = function(req, res, next) {
        service.findAll(function(err, result) {
            var message;
            if (err) {
                router.error(res, err, next);
            } else {
                message = _.map(result, function(id) {
                    return basePath(req, id);
                });
                res.format(format(res, message));
                next();
            }
        });
    };
    
    function basePath(req, id) {
        return [req.baseUrl, id].join('/');
    }
    
    /**
     * reads the resource specified by req.params.id
     */
    router.read = function(req, res, next) {
        service.findById(req.params.id, function(err, result) {
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