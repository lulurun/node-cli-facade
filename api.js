'use strict';

var util = require('util');
var express = require('express');
var Facade = require(__dirname + '/facade').Facade;

var verb2method = {
  "get": "get",
  "read": "get",
  "select": "get",

  "post": "post",
  "set": "post",
  "update": "post",
  "delete": "post",
  "remove": "post",
  "create": "post",
  "exec": "post",
  "run": "post",
};

var guessHttpMethod = function(name) {
  var m = name.match(/^([a-z]+)[_A-Z]/);
  if (m && m[1] in verb2method) {
    return verb2method[m[1]];
  }
  return 'get';
};

function apiFacade(loadModulePath) {
  apiFacade.super_.call(this, loadModulePath);
};
util.inherits(apiFacade, Facade);

apiFacade.prototype.setup = function(app) {
  var self = this;
  var app = express();

  app.get('/', function(req, res, next){
    res.json({ help: self.modules });
    next();
  });

  for (var moduleName in self.modules) {
    (function(moduleName){
      app.get('/' + moduleName, function(req, res, next){
        res.json({ help: self.modules[moduleName]});
      });
    })(moduleName);

    var mod = self.modules[moduleName];
    for (var funcName in mod.funcs) {
      (function(moduleName, funcName, mod){
        var func = mod.funcs[funcName];
        var method = guessHttpMethod(funcName);
        func.method = method;
        app[method]('/' + moduleName + '/' + funcName, function(req, res, next){
          var argv = [];
          var i = 0, len = func.args.length;
          for (; i < len; ++i) {
            argv.push(req.param(func.args[i]));
          }
          var domain = require('domain').create();
          domain.run(function() {
            process.nextTick(function() {
              self.exec(moduleName, funcName, argv, function(result){
                res.json(result);
                next();
              })
            });
          });
          domain.on('error', function(e) {
            console.error('Error cli:', e);
            res.json({err: e});
            next();
          });
        });
      })(moduleName, funcName, mod);
    }
  }

  return app;
};

var setup = exports.setup = function(loadModulePath) {
  loadModulePath = loadModulePath || process.cwd();

  var api = new apiFacade(loadModulePath);
  return api.setup();
};

