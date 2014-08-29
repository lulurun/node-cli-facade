'use strict';

var path = require('path');
var util = require('util');
var Facade = require(__dirname + '/facade').Facade;

function cliFacade(loadModulePath) {
  cliFacade.super_.call(this, loadModulePath);
};
util.inherits(cliFacade, Facade);

cliFacade.prototype.help = function(moduleName){
  if (!moduleName) {
    console.log('Usage:');
    console.log(this.node + ' ' + this.script);
    console.log('\tPrint this message.');
    console.log('');

    for (var moduleName in this.modules) {
      this.help(moduleName);
    }
    console.log('');
  } else {
    if (!(moduleName in this.modules)) {
      console.log('Module not found: ' + moduleName);
      return;
    }
    console.log('[Module "' + moduleName + '"] Available commands:');
    var mod = this.modules[moduleName];
    for (var funcName in mod.funcs) {
      var cmdArgs = [this.node, this.script, moduleName,funcName];
      cmdArgs = cmdArgs.concat(mod.funcs[funcName].args.map(function(v){ return '$' + v; }));
      console.log('\t' + cmdArgs.join(' '));
    }
    console.log('');
  }
};

cliFacade.prototype.run = function(argv, cb) {
  this.node = argv.shift();
  this.script = path.basename(argv.shift());

  var moduleName = argv.shift();
  if (!moduleName) {
    this.help();
    cb();
  } else {
    var funcName = argv.shift();
    if (!funcName) {
      this.help(moduleName);
      cb();
    } else {
      this.exec(moduleName, funcName, argv, cb);
    }
  }
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

