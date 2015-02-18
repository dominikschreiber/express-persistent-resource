'use strict';

module.exports = function(service) {
    var _ = require('lodash')
      , router = {};
    
    router.error = function(res, err, next) {
        res.status(500)
            .json(err);
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
            if (err) {
                router.error(res, err, next);
            } else {
                res.json(_.map(result, function(id) {
                    return basePath(req, id);
                }));
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
            if (err) {
                router.error(res, err, next);
            } else {
                res.json(result);
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
            if (err) {
                router.error(res, err, next);
            } else {
                res.json(basePath(req, id));
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
};