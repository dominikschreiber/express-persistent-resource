'use strict';

module.exports = function(db, options) {
    var service = {}
      , _ = require('lodash')
      , crypto = require('crypto')
      , model = require('./model')
      , configuration = _.defaults(options, {
          view: '',
          fields: {},
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
    service.init = function(additionalViews) {
        var design = '_/design' + configuration.view
          , views = _.extend({
                findAll: {
                    map: 'function(doc) { if (doc._id.indexOf("' + configuration.view + '-") === 0) { emit(doc._id, doc); } }'
                }
            }, additionalViews);

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

    function isVersionedInDatabase(doc) {
        return doc !== undefined
            && doc._rev !== undefined;
    }

    function addVersionFromDatabase(doc, versioned) {
        return _.extend(doc, { _rev: versioned._rev });
    }

    /**
     * finds all entries managed by this service
     */
    service.findAll = function(next) {
        db.view(configuration.view, 'findAll', function(err, result) {
            if (err) {
                next(err);
            } else {
                next(null, _.map(result.rows, pickPublicIdFromRow));
            }
        });
    };

    function pickPublicIdFromRow(row) {
        return pickPublicIdFromId(row.value._id);
    }

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
                next(null, _.omit(_.extend(doc, { id: pickPublicIdFromId(doc._id) }), ['_id', '_rev']));
            }
        });
    };

    function createPrivateId(id) {
        return [configuration.view, id].join('-');
    }

    /**
     * saves/updates the managed entry.
     * validates it against the model specified in the configuration.
     */
    service.save = function(entry, next) {
        var safe = model.validate(entry, configuration.model)
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

    return service;
};
