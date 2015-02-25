'use strict';

var app = require('express')()
  , resource = require('../../src/index');

app.use(require('body-parser').json());
app.use('/api/v1/cat', resource('cat', require('nano')('http://localhost:5984/animals'), {
    fields: 'name,type,fur,food',
    id: function(doc) {
        return doc.name.toLowerCase().replace(/[\w_]/g, '-');
    }
}));

app.listen(9999);