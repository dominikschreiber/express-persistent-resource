# express-persistent-resource

*If you're using a full ORM (namely: [sequelize](http://sequelizejs.com)), consider using [express-rest-orm](https://github.com/dominikschreiber/express-rest-orm) instead. If not, consider using both sequelize and express-rest-orm.*

[![Build Status](https://img.shields.io/travis/dominikschreiber/express-persistent-resource.svg?style=flat-square)](https://travis-ci.org/dominikschreiber/express-persistent-resource) [![Version](https://img.shields.io/npm/v/express-persistent-resource.svg?style=flat-square)](https://www.npmjs.com/package/express-persistent-resource) [![Downloads](https://img.shields.io/npm/dm/express-persistent-resource.svg?style=flat-square)](https://www.npmjs.com/package/express-persistent-resource) [![License](https://img.shields.io/npm/l/express-persistent-resource.svg?style=flat-square)](LICENSE) [![Join the chat at https://gitter.im/dominikschreiber/express-persistent-resource](https://img.shields.io/badge/gitter-join%20chat-green.svg?style=flat-square)](https://gitter.im/dominikschreiber/express-persistent-resource?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

*express-persistent-resource* creates a full-featured CRUD resource (express) middleware that persists all information to a given CouchDB instance. It's as simple as

```javascript
var resource = require('express-persistent-resource');
app.use('/bread', resource('bread', 'http://localhost:5984/awesome-food', {
  fields: 'title,ingredients:(title)'
}));
```

You get

```
GET /bread => list of all bread urls, e.g. ['/bread/french', '/bread/rye', '/bread/brown']
POST /bread => url to the newly created bread, e.g. '/bread/pita'

GET /bread/:id => the single bread
PUT /bread/:id => update of the single bread, gives the url of the updated bread
DELETE /bread/:id => deletes the single bread
```

as well as advanced features like *fields selection* and *pagination* (tbd) as described in [Web API Design &ndash; Crafting Interfaces that Developers Love](http://apigee.com/about/resources/ebooks/web-api-design).

## getting started

Grab yourself a npm and go

```bash
npm install express-persistent-resource
```

Then set up a CouchDB instance (e.g. [Cloudnode](https://cloudno.de) or [Cloudant](https://cloudant.com/) offer hosted instances), grab its url and start rolling:

```javascript
var express = require('express')
  , resource = require('express-persistent-resource')
  , couchdbInstance = 'your://couch.db/instance' // e.g. http://localhost:5984/awesome-project
  , app = express();

app.use('/api/v1/awesome', resource('awesome', couchdbInstance, {
   ...
}));

app.use('/api/v1/evenmore', resource('evenmore', couchdbInstance, {
   ...
}))
```

## api documentation

### `require('express-persistent-resource')(name, db, options)`

- `name` is the name of the resource. This will be prefixed to all CouchDB entries assigned to this resource.
- `db` is either a url to a CouchDB instance or a [nano](https://github.com/dscape/nano)-wrapped CouchDB instance (useful if you have more than one resource)
- `options` configure the resource creation/storing process. A subset of
    - `fields` *(required)*: properties the stored entries are allowed to have. `POST`ed entries are validated against this. See [test/model.spec.js](test/model.spec.js) for details. In short, this is a string like `id,name:(givenname,familyname),age`, where each `:(...)` denotes a nested object/a list of nested objects.
    - `id`: function that determines how ids of this resource should look like. Is called with the incoming entry to create an id for it. Defaults to a substring of the sha256-hash of the entry.
    - `views`: additional map/reduce views given to the CouchDB service. May be removed in the future. See the [CouchDB Guide](http://guide.couchdb.org/draft/design.html#basic) for details (this property is merged into the `views` property of the design document).

## features ([ ] planned, [x] implemented)

- [ ] _`/`:_ all resources
  - [x] _`OPTIONS /`:_ list methods
  - [x] _`GET /`:_ list resource urls
  - [x] _`POST /`:_ create resource
  - [ ] _`PUT /`:_ bulk update resources
  - [ ] _`DELETE /`:_ delete all resources
- [ ] _`/:id`:_ a single resource
  - [x] _`GET /:id`:_ read resource
  - [ ] _`POST /:id`:_ error -> use `PUT /:id` or `POST /`
  - [x] _`PUT /:id`:_ update resource
  - [x] _`DELETE /:id`:_ delete resource
- [ ] _`/:id/:field`:_ all nested resources
  - [ ] _`GET /:id/:field`:_ list nested resources (simulate with `GET /:id?fields=:field`)
  - [ ] _`POST /:id/:field`:_ create nested resource (added to `:field` list)
  - [ ] _`PUT /:id/:field`:_ bulk update nested resources
  - [ ] _`DELETE /:id/:field`:_ delete all nested resources
- [ ] _`/:id/:field/:id`:_ a single nested resource
  - [ ] _`GET /:id/:field/:id`:_ read nested resource (simulate with `GET /:id/:field`, then `GET` field url)
  - [ ] _`POST /:id/:field/:id`:_ error -> use `PUT /:id/:field/:id` or `POST /:id/:field`
  - [ ] _`PUT /:id/:field/:id`:_ update nested resource
  - [ ] _`DELETE /:id/:field/:id`:_ delete nested resource
- [ ] _`?`:_ query parameters
  - [x] _`?include_docs`:_ when `GET /?include_docs`, list docs instead of urls
  - [x] _`?field=filter`:_ list `resource`s that match `filter` on `field`. Support
    - [x] _`=`:_ exact match
    - [x] _`~=`:_ one of
    - [x] _`|=`:_ exact match or starts with + `-` (namespacing)
    - [x] _`^=`:_ starts with
    - [x] _`$=`:_ ends with
    - [x] _`*=`:_ contains
  - [x] _`?fields=`:_ partial response (filtered by `model.validate`)
  - [ ] _`?limit=` and `?offset=`:_ pagination (`limit` entries per call, `offset` entries skipped)
  - [ ] _`?q=`:_ search resources for query
  - [ ] _`?method=`:_ override http method with `method` (`GET /?method=POST` equals `POST /`)
  - [ ] _`?suppress_response_codes=true`:_ override response code with `200`, put response code in result
- [ ] _`.:ext`:_ resource serialization
  - [ ] _`.json`:_ (default) resources as json
  - [ ] _`.xml`:_ resources as xml
  - [ ] _`.yml`:_ resources as yaml
- [ ] _`Accept:`:_ resource serialization
  - [x] _`*/json`:_ resources as json
  - [x] _`*/xml`:_ resources as xml
  - [ ] _`*/yml`:_ resources as yaml

## changelog

### 0.2.1

- *feature:* `GET /:id?fields=<fields>` returns subset of `/:id` matching `<fields>`

### 0.2.0

- *feature:* `GET /?fields=<fields>&include_docs` returns result subsets of only `<fields>`

### 0.1.1

- *fix:* `DELETE /:id Accept:application/json` returns `"/"` instead of `/` now

### 0.1.0

- *feature:* `GET /?field=filter` filters resources based on the given filter, allowing nested fields via a string for `model.parse`

### 0.0.4

- *feature:* `Accept: */json` + `Accept: */xml` based resource serialization
- *feature:* `GET /?include_docs` returns list of docs instead of urls

### 0.0.3

- *fix:* fields strings with multiple nested objects (e.g. `foo:(bar,baz),goo:(g,le)`) are now handled correctly

### 0.0.2

- *feature:* `DELETE /:id` deletes the document specified by `:id`, returns url of the resource mount point (e.g. `/api/v1/cat`)

### 0.0.1

- *feature:* `GET /` returns list of urls relative to `/` (e.g. when mounted at `/api/v1/cat`: `['/api/v1/cat/foo','/api/v1/cat/bar']`)
- *feature:* `POST /` creates a new document, returns url of that document (e.g. `/api/v1/cat/baz`)
- *feature:* `GET /:id` returns the document specified by `:id`
- *feature:* `PUT /:id` updates the document specified by `:id`, returns url of the updated document (e.g. `/api/v1/cat/baz`)

## license

The MIT License (MIT)

Copyright (c) 2015 Dominik Schreiber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
