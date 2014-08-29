#!/usr/bin/env node

if (require.main === module) {
  var express = require('express');
  var bodyParser = require('body-parser');
  var morgan = require('morgan');

  var facade = new require('../');

  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(morgan("combined"));
  app.use(function(req, res, next){
    res.header('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,HEAD,OPTIONS");
    next();
  });
  app.use("/api", facade.api.setup());

  app.listen(9000, function() {
    console.log('api server started');
  });
}
