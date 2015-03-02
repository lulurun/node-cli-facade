'use strict';

var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');

var Facade = require(__dirname + '/facade').Facade;

function apiFacade(loadModulePath) {
  apiFacade.super_.call(this, loadModulePath);
};
util.inherits(apiFacade, Facade);

apiFacade.prototype.serve = function(options) {
  var self = this;
  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(morgan("combined"));

  app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,HEAD,OPTIONS");
    next();
  });
  app.all('/*', function(req, res, next){
    res.header('Content-Type', 'application/json');
    next();
  });

  for (var moduleName in self.modules) {
    var mod = self.modules[moduleName];
    for (var funcName in mod) {
      (function(moduleName, funcName, func){
        var funcUrl = '/' + moduleName + '/' + funcName;
        app.all(funcUrl, function(req, res, next){
          var options = {};
          for (var i in func.options) options[i] = func.options[i];
          for (var i in req.query) options[i] = req.query[i];
          for (var i in req.body) options[i] = req.body[i];

          var domain = require('domain').create();
          domain.run(function() {
            process.nextTick(function() {
              self.exec(moduleName, funcName, options, function(result){
                res.json({res:1, data: result});
              })
            });
          });
          domain.on('error', function(e) {
            res.json({res: 0, err: e});
          });
        });
      })(moduleName, funcName, mod[funcName]);
    }
  }

  return app;
};

exports.init = function(loadModulePath) {
  loadModulePath = loadModulePath || process.cwd();
  return new apiFacade(loadModulePath);
};

