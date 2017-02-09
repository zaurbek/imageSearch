var express = require('express')
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var app = express()
var path = require("path")
var favicon = require('serve-favicon');

var secure=require("./secure.js")
var port=process.env.PORT || 8080


var Bing = require('node-bing-api')({ accKey: secure.apikey });
 

app.get('/',function(req,res) {
  console.log(req.url)
  res.sendFile(path.join(__dirname+'/index.html'))
})
  
app.use('/public',express.static('public'))

app.use(favicon(__dirname+'/public/favicon.ico'))
  
app.get('/api/imagesearch/:search', function (req, res) {
  var answer=[]
  var num
  if (req.query !== {}&&req.query.hasOwnProperty('offset')&&!isNaN(req.query.offset)){
        if (req.query.offset>10) {
          num=50
        } else {
          num=req.query.offset*5
        }
  } else {
  num=5
  }  
  
  var date=new Date()
  var dbinsert={
    query: req.params.search,
    time: date.getDate()+'/'+date.getMonth()+'/'+date.getFullYear()+'  '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
  }
  

  // Connection URL. This is where your mongodb server is running.

// Use connect method to connect to the Server
  MongoClient.connect(secure.dblink, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', secure.dblink);

    // do some work here with the database.
    var collection = db.collection('imagehistory')
    
    var Access=function(db,callback) {
      collection.insert([dbinsert])
      console.log('parsed image history')
    }
    Access(db,function() {
      db.close()
    })
    
  }
});
  console.log(dbinsert)
  Bing.images(req.params.search, {
  top: num, 
  skip: num-5
  }, function(error, response, body){
    var it=body.value
    for (var x=0; x<body.value.length; x++) {
      var object={
        snippet: it[x].name,
        url: it[x].contentUrl,
        thumbnail: it[x].thumbnailUrl,
        website: it[x].hostPageUrl
      }
      answer.push(object)
      
    }
    
    res.json(answer)
  });
  
  
  
})
  
app.get('/api/history',function(req,res) {
  
  MongoClient.connect(secure.dblink, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', secure.dblink);

    // do some work here with the database.
    var collection = db.collection('imagehistory')
    
    var readDB=function(db,callback) {
      collection.find({},{_id:0,query:1,time:1}).sort({_id:-1}).limit(10).toArray().then(function(snap) {
        console.log(snap)
        res.json(snap)
      })
    }
    readDB(db,function() {
      db.close()
    })
    
  }
});
  
})


app.listen(port, function () {
  console.log('Example app listening on port '+port)
})