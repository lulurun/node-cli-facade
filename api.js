'use strict';

var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
var Facade = require(__dirname + '/facade').Facade;

function apiFacade(loadModulePath) {
  apiFacade.super_.call(this, loadModulePath);
};
util.inherits(apiFacade, Facade);

apiFacade.prototype.createApp = function(opt) {
  opt = opt || {};
  var self = this;
  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.all('/*', function(req, res, next){
    res.header('Content-Type', 'application/json');
    next();
  });

  for (var moduleName in self.modules) {
    var mod = self.modules[moduleName];
    for (var funcName in mod) {
      (function(moduleName, funcName, func){
        var sync = (!opt.async || moduleName === 'help');

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
                if (sync) {
                  res.json({data: result});
                } else {
                  // TODO log result
                  console.log(result);
                }
              })
            });
          });
          domain.on('error', function(e) {
            // TODO log error message
            console.log(e);
            if (sync) {
              res.json({err: e.message});
            }
          });

          if (!sync) {
            res.json({accepted: 1});
          }
        });
      })(moduleName, funcName, mod[funcName]);
    }
  }

  return app;
};

exports.getOrCreateFacade = (function(){
  var myFacades = {};
  return function(loadModulePath){
    if (!myFacades[loadModulePath]) {
      myFacades[loadModulePath] = new apiFacade(loadModulePath);
    }
    return myFacades[loadModulePath];
  };
})();
