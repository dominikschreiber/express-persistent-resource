'use strict';

module.exports = function(name, db, options) {
    var _ = require('lodash')
      , configuration = _.extend({view: name}, options)
      , service = require('./service')(db, {
            view: configuration.view
            fields: configuration.fields,
            id: configuration.id
        })
      , router = require('./router')(service, {
            fields: configuration.fields
        })
      , middleware = require('express').Router();

    middleware.get('/', router.list);
    middleware.post('/', router.create);
    middleware.get('/:id', router.read);
    middleware.put('/:id', router.update);

    return middleware;
};
