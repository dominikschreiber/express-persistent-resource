'use strict';

module.exports = function(name, db, options) {
    var _ = require('lodash')
      , configuration = _.extend({view: name}, options)
      , service = require('./service')(db, {
            view: configuration.view,
            fields: configuration.fields,
            id: configuration.id
        })
      , router = require('./router')(service, {
            fields: configuration.fields
        })
      , middleware = require('express').Router();

    middleware.route('/')
        .get(router.list)
        .post(router.create);
    
    middleware.route('/:id')
        .get(router.read)
        .put(router.update);

    return middleware;
};
