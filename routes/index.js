var express = require('express');
var router = express.Router();
var es = require('event-stream');
var JSONStream = require('JSONStream');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

var stream = require('stream');
var util = require('util');
var Transform = stream.Transform || require('readable-stream').Transform;

/* GET home page. */
router.get('/api', function(req, res, next) {

  MongoClient.connect('mongodb://localhost:27017/youtube', function(err, db) {

    if (err) {
      return next(err);
    }

    res.set('Content-Type', 'application/json');
    res.write('{"data":[');

    var prevChunk = null;

    //fs.createReadStream('./files/all.csv')
    db.collection('channel').find({}).limit(10)
    //db.collection('channel').find({})
    //.pipe(es.split())
    //.pipe(DelayStream(2000))
    //.pipe(CreateJSONObject())
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
      console.log('done');
    });

    // db.collection('channel').find({}).stream({
    //   transform: function(doc) { 
    //     return JSON.stringify(doc);
    //   }
    // })
    // .pipe(DelayStream(1000))
    // .on('data', function(data) {
    //   res.write(data.toString());
    // })
    // .on('end', function() {
    //   res.end();
    //   db.close();
    // });

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