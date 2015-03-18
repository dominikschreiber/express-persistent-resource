'use strict';

module.exports = function(db, options) {
    var service = {}
      , _ = require('lodash')
      , crypto = require('crypto')
      , model = require('./model')
      , configuration = _.defaults(options, {
          view: '',
          fields: {},
          views: {},
          id: function(entry) {
              return (new Date()).getTime() + '-' + hash(entry).slice(0,8);
          }
      });

    function hash(entry) {
        return crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
    }

    /**
     * Sets up the db with a view for entries managed by this service.
     * Parses configuration.fields to an object if necessary.
     */
    service.init = function() {
        var design = '_design/' + configuration.view
          , views = _.extend({
                findAll: {
                    map: 'function(doc) { if (doc._id.indexOf("' + configuration.view + '-") === 0) { emit(doc._id, doc); } }'
                }
            }, configuration.views);

        db.get(design, function(err, result) {
            var docs = { views: views };
            if (isVersionedInDatabase(result)) {
                addVersionFromDatabase(docs, result);
            }
            db.insert(docs, design);
        });

        if (typeof configuration.fields === 'string') {
            configuration.fields = model.parse(configuration.fields);
        }
    };
    service.init();

    function isVersionedInDatabase(doc) {
        return doc !== undefined
            && doc._rev !== undefined;
    }

    function addVersionFromDatabase(doc, versioned) {
        return _.extend(doc, { _rev: versioned._rev });
    }

    /**
     * finds all entries managed by this service. allows options
     *
     * options = {
     *   shouldIncludeDocs: false // => if true, return full docs instead of ids
     *   filters: undefined // => if [{property, match, filter}] filters docs by these
     * }
     */
    service.findAll = function(options, next) {
        _.defaults(options, {
            shouldIncludeDocs: undefined,
            filters: undefined,
            fields: undefined
        });
        db.view(configuration.view, 'findAll', function(err, result) {
            var docs, fields;
            if (err) {
                next(err);
            } else {
                docs = _.map(_.pluck(result.rows, 'value'), createPublicDoc);
                
                if (options.filters !== undefined) {
                    docs = model.filter(docs, options.filters);
                }
                
                if (options.fields !== undefined && options.shouldIncludeDocs) {
                    fields = (_.isObject(options.fields)) ? options.fields : model.parse(options.fields);
                    docs = _.map(docs, function(doc) { return model.validate(doc, fields); });
                }
                
                if (!options.shouldIncludeDocs) {
                    docs = _.pluck(docs, 'id');
                }
                
                next(null, docs);
            }
        });
    };
    
    function pickPublicIdFromId(_id) {
        return _id.slice((configuration.view + '-').length);
    }
    
    /**
     * finds the entry with the specified public id that is managed by this service
     */
    service.findById = function(id, next) {
        db.view(configuration.view, 'findAll', {
            key: createPrivateId(id),
            include_docs: true
        }, function(err, result) {
            var doc;

            if (err) {
                next(err);
            } else if (_.isEmpty(result.rows)) {
                next(new Error('no ' + configuration.view + ' with id ' + id + ' found'));
            } else {
                doc = result.rows[0].doc;
                next(null, createPublicDoc(doc));
            }
        });
    };
    
    function createPublicDoc(doc) {
        return _.omit(_.extend(doc, { id: pickPublicIdFromId(doc._id) }), ['_id', '_rev']);
    }

    function createPrivateId(id) {
        return [configuration.view, id].join('-');
    }

    /**
     * saves/updates the managed entry.
     * validates it against the model specified in the configuration.
     */
    service.save = function(entry, next) {
        var safe = model.validate(entry, configuration.fields)
          , id = safe.id
          , _id = createPrivateId(id);
        
        if (_.isEmpty(safe) && !_.isEmpty(entry)) {
            next(new Error('entry ' + JSON.stringify(entry) + ' does not match model ' + model.stringify(configuration.model)));
        } else if (id !== undefined) {
            db.get(_id, function(err, result) {
                if (err) {
                    next(err);
                } else {
                    if (isVersionedInDatabase(result)) {
                        addVersionFromDatabase(safe, result);
                    }
                    insertInDatabase(_.extend(safe, {_id: _id}), next);
                }
            });
        } else {
            insertInDatabase(extendWithIds(safe), next);
        }
    };

    function insertInDatabase(doc, next) {
        db.insert(doc, doc._id, function(err) {
            if (err) {
                next(err);
            }  else {
                next(null, doc.id);
            }
        });
    }

    function extendWithIds(doc) {
        var id = configuration.id(doc)
          , _id = createPrivateId(id);

        return _.extend(doc, {
            id: id,
            _id: _id
        });
    }
    
    /**
     * deletes the managed entry specified by id
     */
    service.delete = function(id, next) {
        var _id = createPrivateId(id);
        
        db.get(_id, function(gerr, gresult) {
            db.insert(_.extend(gresult, {_deleted: true}), _id, next);
        });
    };
    
    return service;
};
