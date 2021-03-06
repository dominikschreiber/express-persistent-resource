'use strict';

module.exports = function(name, db, options) {
    var _ = require('lodash')
      , couch = (typeof db === 'string') ? require('nano')(db) : db
      , configuration = _.extend({view: name}, options)
      , service = require('./service')(couch, {
            view: configuration.view,
            views: configuration.views,
            fields: configuration.fields,
            id: configuration.id
        })
      , router = require('./router')(service, {
            view: configuration.view,
            fields: configuration.fields
        })
      , middleware = require('express').Router();

    middleware.route('/')
        .get(router.list)
        .post(router.create);
    
    middleware.route('/:id')
        .get(router.read)
        .put(router.update)
        .delete(router.delete);

    return middleware;
};
