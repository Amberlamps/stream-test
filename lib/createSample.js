/**
 * Script to create sample files.
 */

var MongoClient = require('mongodb').MongoClient;
var Chance = require('chance');
var chance = new Chance();

var SAMPLE_SIZE = 100000;

function createSample() {

  var sample = {
    name: chance.name(),
    birthday: chance.birthday()
  };

  return sample;

}

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {

  if (err) {
    return console.error(err);
  }

  var bulk = db.collection('users').initializeUnorderedBulkOp();
  for (var i = 0; i < SAMPLE_SIZE; i++) {
    bulk.insert(createSample());
  }

  bulk.execute(function (err, results) {

    if (err) {
      return console.error(err);
    }

    console.log('done!');
    db.close();

  });

});