'use strict';
var util = require('util');
var Facade = require(__dirname + '/facade').Facade;
var hogan = require('hogan');

function ViewBase() {};
ViewBase.prototype.makeData = function(data, callback) { callback(); };
ViewBase.prototype.getTemplate = function(callback) { callback(); };
ViewBase.prototype.render = function(data, callback) {
  var self = this;
  self.getTemplate(function(){
    if (!self.template) return callback(data);
    self.makeData(data, function(){
      var t = hogan.compile(self.template);
      callback(t.render(self.data || data));
    });
  });
};

function cliFacade(loadModulePath) {
  cliFacade.super_.call(this, loadModulePath);
  this.node = process.argv[0];
  this.script = process.argv[1];
};
util.inherits(cliFacade, Facade);

cliFacade.prototype.getView = function(moduleName, functionName) {
  var createViewObj = function(view) {
    var obj = new ViewBase();
    if (view.makeDate) obj.makeData = view.makeData;
    if (view.getTemplate) obj.getTemplate = view.getTemplate;
    if (view.template) obj.template = view.template;
    return obj;
  };

  var func = this.getFunction(moduleName, functionName);
  if (!func) return null;
  if (func.view) return createViewObj(func.view);
  // TODO, require view.js
  return null;
};

cliFacade.prototype.run = function(moduleName, funcName, options, callback) {
  var self = this;
  if (!moduleName) {
    return self.run('help', 'all', {}, callback);
  }
  if (!funcName) {
    return self.run('help', 'module', { name: moduleName }, callback);
  }

  var domain = require('domain').create();
  domain.run(function() {
    process.nextTick(function() {
      self.exec(moduleName, funcName, options, function(res){
        var view = self.getView(moduleName, funcName);
        if (view) {
          res = view.render(res, function(res){
            callback(null, res);
          });
        } else {
          callback(null, res);
        }
      });
    });
  });
  domain.on('error', function(e) {
    callback(e);
  });
};

exports.getOrCreateFacade = (function(){
  var myFacade = null;
  return function(loadModulePath, cb){
    if (!myFacade) {
      myFacade = new cliFacade(loadModulePath);
    }
    cb(myFacade);
  };
})();
