var fs = require('fs');
var path = require('path');
var debug = require('debug')('cli-facade');

var argv = process.argv.concat();
var defaultCallback = function() {};

var loadModules = function(loadModulePath) {
  var modules = {};
  debug('load cli modules from ' + loadModulePath);
  var files = fs.readdirSync(loadModulePath);
  var i = 0, len = files.length;
  for (; i<len; ++i) {
    if (files[i].indexOf('.') === 0) continue;
    if (files[i].indexOf('#') === 0) continue;

    var fullpath = loadModulePath + '/' + files[i];
    if (!fs.statSync(fullpath).isFile()) continue;
    if (path.extname(fullpath) !== '.js') continue;

    var mod = require(fullpath);
    if (!mod.cliModule) continue;

    var base = path.basename(fullpath, '.js');
    modules[base] = mod;
    debug('loaded module ' + base);
  }
  return modules;
};

var getMethodArgs = function(method) {
  var body = (method + '').trim();
  var m = body.match(/^function\s*\(([^\)]*)\)/);
  return m ? m[1].split(',').map(function(v){ return '$' + v.trim(); }).slice(0, -1) : [];
};

function Facade() {};

Facade.prototype.run = function(loadModulePath, cb) {
  this.modules = loadModules(loadModulePath);

  var node = argv.shift();
  var script = argv.shift();
  this.help = new help(node, script);

  var moduleName = argv.shift();
  if (!moduleName || moduleName === '--help') {
    this.help.usage(this.modules);
    process.exit(0);
  } else {
    this.help.setModuleName(moduleName);
    var mod = this.getModule(moduleName);
    var methodName = argv.shift();
    var method = this.getMethod(mod, methodName);
    var argsLen = getMethodArgs(method).length;
    if (argv.length > argsLen) {
      argv = argv.slice(0, argsLen);
    }
    argv.push(cb || defaultCallback);
    method.apply(this, argv);
  }
}

Facade.prototype.getModule = function(name) {
  if (!(name in this.modules)) {
    this.help.modules(this.modules);
    throw new Error('Unknown module: ' + name);
  }
  return this.modules[name];
};

Facade.prototype.getMethod = function(mod, name) {
  if (name === '--help') {
    return function() { this.help.methods(mod); };
  }
  if (!name) {
    if (mod.main) {
      return mod.main;
    } else {
      return function() { this.help.methods(mod); };
    }
  } else {
    if (name in mod) {
      return mod[name];
    } else {
      this.help.methods(mod);
      throw new Error('Method not found in module: ' + name);
    }
  }
};

function help(node, script) {
  this.prefix = path.basename(node) + ' ' + path.basename(script);
}

help.prototype.setModuleName = function(name) {
  this.moduleName = name;
  this.prefix += ' ' + name;
};

help.prototype.usage = function(modules) {
  console.log('Usage:');
  console.log(this.prefix + ' --help');
  console.log('\tPrint this message.');
  console.log('');
  this.modules(modules);
};

help.prototype.methods = function(mod) {
  console.log('Available methods in module "' + this.moduleName + '":');
  for (var i in mod) {
    if (typeof(mod[i]) === 'function') {
      var args = getMethodArgs(mod[i]);
      console.log('\t' + this.prefix + ' ' + i + ' ' + args.join(' '));
    }
  }
  console.log('');
};

help.prototype.modules = function(modules) {
  console.log('Available modules:');
  for (var i in modules) {
    console.log('\t' + i);
  }
  console.log('');
  console.log('More help for each module:');
  console.log(this.prefix + ' $module --help');
  console.log('');
}

exports.run = function(loadModulePath, cb) {
  if (typeof(loadModulePath) === 'function') {
    cb = loadModulePath;
    loadModulePath = null;
  }
  loadModulePath = loadModulePath || process.cwd();

  var domain = require('domain').create();
  domain.run(function() {
    process.nextTick(function() {
      var facade = new Facade();
      facade.run(loadModulePath, cb);
    });
  });
  domain.on('error', function(e) {
    console.error('Error cli-facade: ' + e.message);
    if (cb) cb(e);
  });
}

