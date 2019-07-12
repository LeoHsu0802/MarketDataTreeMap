const mysql = require('mysql');
const express = require('express');
var cors = require('cors');
const server = express();
const bodyparser = require('body-parser');
//全域開放，避免CORS跨域阻擋
server.use(cors());
server.use(bodyparser.json());
// creat connection
var db = mysql.createConnection({
  host     : '10.99.103.198',
  user     : '354',
  password : '354354354',
  database : 'futurescompetition' 
});

//connect
db.connect((err) => {
  if(err){
    throw err;
  }
  console.log('MySQL Connected...')
});

// check running enviroment
const port = process.env.PORT || 3001;

// create
server.listen(port);
// only print hint link for local enviroment 
if(port === 3001){
  console.log('RUN http://localhost:3001/')
}

server.get('/futures',(req,res)=>{
  var quotes ="";
  db.query('SELECT type , symbolroot AS name , todayvolume AS volume , oi AS value ,lastprice AS price, ROUND(percent, 2) AS pc FROM lastestquotes_test',(err,rows,fields)=>{
    if(!err){
    console.log(rows);
    res.send(rows);
    }
    else
    console.log(err);
  })
});

module.exports.server = server;
