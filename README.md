# express-persistent-resource

[![Build Status](https://travis-ci.org/dominikschreiber/express-persistent-resource.svg?branch=master)](https://travis-ci.org/dominikschreiber/express-persistent-resource) [![Join the chat at https://gitter.im/dominikschreiber/express-persistent-resource](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dominikschreiber/express-persistent-resource?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

as well as advanced features like *fields selection* (tbd) and *pagination* (tbd) as described in [Web API Design &ndash; Crafting Interfaces that Developers Love](http://apigee.com/about/resources/ebooks/web-api-design).

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

## current status

Basic CRUD works (& is tested). It is planned to serve all features described in the Web API Design book.

## planned

- [ ] `?field=filter`: list `resource`s that match `filter` on `field`. Support `=` (exact match), `~=` (one of), `|=` (exact match, or starting with + `-`), `^=` (starts with), `$=` (ends with) and `*=` (contains).
- [ ] `?fields=`: partial response (filtered by `model.validate`)
- [ ] `?limit=` and `?offset=`: pagination (`limit` entries per call, `offset` entries skipped)
- [ ] `?q=`: search resources for query
- [ ] `?method=`: override http method with `method` (`GET /?method=POST` equals `POST /`)
- [ ] `?suppress_response_codes=true`: override response code with `200`, put response code in result
- [ ] `.json` / `Accept: application/json`: (default) resources as json
- [ ] `.xml` / `Accept: text/xml`: resources as xml
- [ ] `.yml` / `Accept: application/yaml`: resources as yaml

## changelog

### 0.0.3

- *fix:* fields strings with multiple nested objects (e.g. `foo:(bar,baz),goo:(g,le)`) are now handled correctly

### 0.0.2

- `DELETE /:id` deletes the document specified by `:id`, returns url of the resource mount point (e.g. `/api/v1/cat`)

### 0.0.1

- `GET /` returns list of urls relative to `/` (e.g. when mounted at `/api/v1/cat`: `['/api/v1/cat/foo','/api/v1/cat/bar']`)
- `POST /` creates a new document, returns url of that document (e.g. `/api/v1/cat/baz`)
- `GET /:id` returns the document specified by `:id`
- `PUT /:id` updates the document specified by `:id`, returns url of the updated document (e.g. `/api/v1/cat/baz`)

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
