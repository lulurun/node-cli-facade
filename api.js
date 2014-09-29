'use strict';

var util = require('util');
var express = require('express');
var Facade = require(__dirname + '/facade').Facade;

function apiFacade(loadModulePath) {
  apiFacade.super_.call(this, loadModulePath);
};
util.inherits(apiFacade, Facade);

apiFacade.prototype.setup = function(app) {
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

  app.get('/api', function(req, res, next){
    app.redirect('/api/help/all');
    next();
  });

  app.all('/api/*', function(req, res, next){
    res.header('Content-Type', 'application/json');
    next();
  });

  for (var moduleName in self.modules) {
    (function(moduleName){
      app.get('/api/' + moduleName, function(req, res, next){
        app.redirect('/api/help/module?name=' + moduleName);
      });
    })(moduleName);

    var mod = self.modules[moduleName];
    for (var funcName in mod) {
      (function(moduleName, funcName, func){
        var funcUrl = moduleName + '/' + funcName;
        app.get('/template/' + funcUrl, function(req, res, next){
          if (func.template) {
            res.write(func.template);
          } else {
            res.write(' '); // should not reach here
          }
        });
        app.all('/api/' + funcUrl, function(req, res, next){
          var options = {};
          for (var i in func.options) {
            if (i in req.query) {
              options[i] = req.query[i];
            } else if (i in req.body) {
              options[i] = req.body[i];
            } else {
              options[i] = func.options[i];
            }
          }
          var domain = require('domain').create();
          domain.run(function() {
            process.nextTick(function() {
              self.exec(moduleName, funcName, options, function(func, result){
                res.json({res:1, data: result});
                next();
              })
            });
          });
          domain.on('error', function(e) {
            console.error('Error cli:', e);
            res.json({res: 0, err: e});
            next();
          });
        });
      })(moduleName, funcName, mod[funcName]);
    }
  }

  return app;
};

var setup = exports.setup = function(loadModulePath) {
  loadModulePath = loadModulePath || process.cwd();

  var api = new apiFacade(loadModulePath);
  return api.setup();
};
