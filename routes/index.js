var express = require('express');
var router = express.Router();
var es = require('event-stream');
var JSONStream = require('JSONStream');
var MongoClient = require('mongodb').MongoClient;

var stream = require('stream');
var util = require('util');
var Transform = stream.Transform || require('readable-stream').Transform;

var database = null;
var cb_queue = [];

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {

  if (err) {
    console.log(err);
    return next(err);
  }

  database = db;

  cb_queue.forEach(function(cb) {
    cb();
  });

});

/* GET home page. */
router.get('/api/:type?', function(req, res, next) {

  var type = req.params.type;
  var items = +req.query.items || 100000;
  console.log(items);
  if (items > 100000) {
    items = 100000;
  } else if (items < 1) {
    items = 1;
  }

  if (!type) {
    type = 'stream';
  }

  if (type === 'stream') {
    return getUsersByStream();
  }

  if (type === 'callback') {
    return getUsersByCallback();
  }

  res.json();

  function getUsersByStream() {

    function getUsers() {

      var prevChunk = null;

      database.collection('users').find({}).limit(items)
      .on('data', function(data) {
        if (prevChunk) {
          res.write(JSON.stringify(prevChunk) + ',');
        }
        prevChunk = data;
      })
      .on('end', function() {
        if (prevChunk) {
          res.write(JSON.stringify(prevChunk));
        }
        res.end(']}');
      });

    }

    res.set('Content-Type', 'application/json');
    res.write('{"data":[');

    if (database) {
      getUsers();
    } else {
      cb_queue.push(getUsers);
    }

  }

  function getUsersByCallback() {

    function getUsers() {

      var prevChunk = null;

      database.collection('users').find({}).limit(items).toArray(function(err, data) {

        if (err) {
          return next(err);
        }

        res.json({ data: data });

      });

    }

    if (database) {
      getUsers();
    } else {
      cb_queue.push(getUsers);
    }

  }

});

router.get('/', function(req, res) {

  res.render('index');

});

module.exports = router;


function DelayStream(delay) {

  if (!(this instanceof DelayStream)) {
    return new DelayStream(delay);
  }

  this.delay = delay || 10;

  Transform.call(this);

}

util.inherits(DelayStream, Transform);

DelayStream.prototype._transform = function _transform(chunk, enc, cb) {

  var self = this;

  setTimeout(function() {
    self.push(chunk);
    cb();
  }, this.delay);

};

function CreateJSONObject() {

  if (!(this instanceof CreateJSONObject)) {
    return new CreateJSONObject();
  }

  this.headerSend = false;
  this.prevChunk = false;

  Transform.call(this);

}

util.inherits(CreateJSONObject, Transform);

CreateJSONObject.prototype._transform = function _transform(chunk, enc, cb) {

  var element = chunk.toString();

  if (!this.headerSend) {
    this.push('[');
    this.headerSend = true;
  }

  if (this.prevChunk) {
    this.push(this.prevChunk + ',');
  }

  this.prevChunk = element;
  cb();

};


CreateJSONObject.prototype._flush = function _flush(cb) {
  this.push(this.prevChunk);
  this.push(']');
  cb();
};