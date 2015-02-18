'use strict';

module.exports = function(db, options) {
    var _ = require('lodash')
      , configuration = _.extend({}, options)
      , service = require('./service')(db)
      , router = require('./router')(service)
      , middleware = require('express').Router();
    
    return middleware;
};