"use strict";
var util = require("util");
var minimist = require("minimist");
var Facade = require(__dirname + "/facade").Facade;
var hogan = require("hogan.js");

function ViewBase() {};
ViewBase.prototype.makeData = function(data, cb) { cb(); };
ViewBase.prototype.getTemplate = function(cb) { cb(); };
ViewBase.prototype.render = function(data, cb) {
  var self = this;
  self.getTemplate(function(){
    if (!self.template) return cb(data);
    self.makeData(data, function(){
      var t = hogan.compile(self.template);
      cb(t.render(self.data || data));
    });
  });
};

function cliFacade(loadModulePath) {
  cliFacade.super_.call(this, loadModulePath);
  this.node = process.argv[0];
  this.script = process.argv[1];
};
util.inherits(cliFacade, Facade);

cliFacade.prototype.getView = function(moduleName, funcName) {
  var createViewObj = function(view) {
    var obj = new ViewBase();
    if (view.makeDate) obj.makeData = view.makeData;
    if (view.getTemplate) obj.getTemplate = view.getTemplate;
    if (view.template) obj.template = view.template;
    return obj;
  };

  var func = this.getFunction(moduleName, funcName);
  if (!func) return null;
  if (func.view) return createViewObj(func.view);
  // TODO, require "view".js
  return null;
};

cliFacade.prototype.run = function(options, cb) {
  var self = this;
  if (typeof(options) === "function") {
    cb = options;
    options = {};
  }

  var argv = process.argv.slice(2);
  // TODO try to avoid passing options.minimist,
  //      get typeof options from module functions
  var opt = minimist(argv, options && options.minimist) || {};
  var moduleName = opt._.shift();
  var funcName = opt._.shift();
  if (!moduleName) {
    moduleName = "help", funcName = "all";
  } else if (!funcName) {
    opt.name = moduleName;
    moduleName = "help", funcName = "module";
  }

  var domain = require('domain').create();
  domain.run(function() {
    process.nextTick(function() {
      var func = self.getFunction(moduleName, funcName);
      if (func && func.hidden)
        throw { err: "Hidden Function", module: moduleName, func: funcName };
      self.exec(func, opt, function(res){
        var view = self.getView(moduleName, funcName);
        if (view) {
          res = view.render(res, function(res){
            cb(null, res);
          });
        } else {
          cb(null, res);
        }
      });
    });
  });
  domain.on('error', function(e) {
    cb(e);
  });
};

exports.getOrCreateFacade = (function(){
  var myFacade = null;
  return function(loadModulePath){
    if (!myFacade) {
      myFacade = new cliFacade(loadModulePath);
    }
    return myFacade;
  };
})();
