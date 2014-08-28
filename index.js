var fs = require('fs');
var path = require('path');
var debug = require('debug')('cli-facade');

var defaultCallback = function() {};

var loadFiles = function(loadPath) {
  var files = [];
  var ls = fs.readdirSync(loadPath);
  var i = 0, len = ls.length;
  for (; i<len; ++i) {
    if (ls[i].indexOf('.') === 0) continue;
    if (ls[i].indexOf('#') === 0) continue;

    var fullpath = path.join(loadPath, ls[i]);
    if (fs.statSync(fullpath).isDirectory()) {
      Array.prototype.push.apply(files, loadFiles(fullpath));
    }
    if (!fs.statSync(fullpath).isFile()) continue;
    if (path.extname(fullpath) !== '.js') continue;

    files.push(fullpath);
  }
  return files;
};

var loadModules = function(loadModulePath) {
  loadModulePath = path.resolve(loadModulePath);
  var modules = {};
  debug('load cli modules from ' + loadModulePath);
  var files = loadFiles(loadModulePath);
  var i = 0, len = files.length;
  for (; i<len; ++i) {
    var f = files[i];
    var mod = require(f);
    if (!mod.cliModule) continue;
    var r = path.relative(loadModulePath, f);
    var dir = path.dirname(r);
    var base = path.basename(r, '.js');
    name = (dir === "." ? "" : dir.replace(/\//g, ".") + ".") + base;
    modules[name] = {
      bin: mod,
      name: name
    };
    debug('loaded ' + name);
  }
  return modules;
};

var getMethodArgs = function(method) {
  var body = (method + '').trim();
  var m = body.match(/^function\s*\(([^\)]*)\)/);
  return m ? m[1].split(',').map(function(v){ return '$' + v.trim(); }).slice(0, -1) : [];
};

var Facade = exports.Facade = function() {};

Facade.prototype.run = function(loadModulePath, argv, cb) {
  this.modules = loadModules(loadModulePath);

  var node = argv.shift();
  var script = argv.shift();
  this.help = new help(node, script);

  var moduleName = argv.shift();
  if (!moduleName || moduleName === '--help') {
    this.help.usage(this.modules);
    process.exit(0);
  } else {
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
  var bin = mod.bin;
  if (!name) {
    return function() { this.help.methods(mod); };
  } else {
    if (name in bin) {
      return bin[name];
    } else {
      this.help.methods(mod);
      throw new Error('Method "' + name + '" is not found in module "' + mod.name + '"');
    }
  }
};

function help(node, script) {
  this.prefix = path.basename(node) + ' ' + path.basename(script);
}

help.prototype.usage = function(modules) {
  console.log('Usage:');
  console.log(this.prefix + ' --help');
  console.log('\tPrint this message.');
  console.log('');
  this.modules(modules);
};

help.prototype.methods = function(mod) {
  console.log('Available methods in module "' + mod.name + '":');
  for (var i in mod.bin) {
    var method = mod.bin[i];
    if (typeof(method) === 'function') {
      var args = getMethodArgs(method);
      console.log('\t' + this.prefix + ' ' + mod.name + ' ' + i + ' ' + args.join(' '));
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

var run = exports.run = function(loadModulePath, cb) {
  if (typeof(loadModulePath) === 'function') {
    cb = loadModulePath;
    loadModulePath = null;
  }
  loadModulePath = loadModulePath || process.cwd();

  var argv = process.argv.concat();

  var domain = require('domain').create();
  domain.run(function() {
    process.nextTick(function() {
      var facade = new Facade();
      facade.run(loadModulePath, argv, cb);
    });
  });
  domain.on('error', function(e) {
    console.error('Error cli-facade: ' + e.message);
    if (cb) cb(e);
  });
}

