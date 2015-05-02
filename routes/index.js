var express = require('express');
var router = express.Router();
var es = require('event-stream');
var JSONStream = require('JSONStream');
var MongoClient = require('mongodb').MongoClient;

var stream = require('stream');
var util = require('util');
var Transform = stream.Transform || require('readable-stream').Transform;

/* GET home page. */
router.get('/api', function(req, res, next) {

  MongoClient.connect('mongodb://127.0.0.1:27017/klatschUndTratsch', function(err, db) {

    if (err) {
      console.log(err);
      return next(err);
    }

    res.set('Content-Type', 'application/json');
    res.write('{"data":[');

    var prevChunk = null;

    db.collection('urls').find({})
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

  });

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