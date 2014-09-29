'use strict';

var path = require('path');
var util = require('util');
var minimist = require('minimist');
var hogan = require('hogan');

var Facade = require(__dirname + '/facade').Facade;
var ModuleBase = require(__dirname + '/facade').ModuleBase;

function cliFacade(loadModulePath) {
  cliFacade.super_.call(this, loadModulePath);
};
util.inherits(cliFacade, Facade);

cliFacade.prototype.run = function(argv, cb) {
  this.node = argv.shift();
  this.script = path.basename(argv.shift());

  var moduleName = argv.shift();
  if (!moduleName) {
    return this.run([this.node, this.script, 'help', 'all'], cb);
  }
  var funcName = argv.shift();
  if (!funcName) {
    return this.run([this.node, this.script, 'help', 'module', '--name', moduleName], cb);
  }
  var options = minimist(argv) || {};
  this.exec(moduleName, funcName, options, function(func, res){
    if (func.template) {
      var template = hogan.compile(func.template);
      res = template.render(res);
    }
    cb(res);
  });
};

var run = exports.run = function(loadModulePath, cb) {
  if (typeof(loadModulePath) === 'function') {
    cb = loadModulePath;
    loadModulePath = null;
  }
  loadModulePath = loadModulePath || process.cwd();
  cb = cb || function() {};

  var domain = require('domain').create();
  domain.run(function() {
    process.nextTick(function() {
      var argv = process.argv.concat();
      var cli = new cliFacade(loadModulePath);
      cli.run(argv, cb);
    });
  });
  domain.on('error', function(e) {
    console.error('Error cli:', e);
    if (e.stack) {
      console.error(e.stack());
    }
    cb();
  });
};

