var fs = require('fs');
var path = require('path');
var debug = require('debug')('cli-facade');

var loadFiles = function (loadPath) {
  var files = [];
  var ls = fs.readdirSync(loadPath);
  var i = 0, len = ls.length;
  for (; i<len; ++i) {
    if (ls[i].indexOf('.') === 0) continue;
    if (ls[i].indexOf('#') === 0) continue;
    if (ls[i] === 'node_modules') continue;

    var fullpath = path.join(loadPath, ls[i]);
    if (fs.statSync(fullpath).isDirectory()) {
      Array.prototype.push.apply(files, loadFiles(fullpath));
      continue;
    }
    if (!fs.statSync(fullpath).isFile()) continue;
    if (path.extname(fullpath) !== '.js') continue;

    files.push(fullpath);
  }
  return files;
};

var getFuncArgs = function (func) {
  var body = (func + '').trim();
  var m = body.match(/^function\s*\(([^\)]*)\)/);
  return m ? m[1].split(',').map(function(v){ return v.trim(); }).slice(0, -1) : [];
};

var getFuncs = function(mod) {
  var funcs = {};
  for (var i in mod) {
    var f = mod[i];
    if (typeof(f) !== 'function') continue;
    funcs[i] = { args: getFuncArgs(f), f: f };
  }
  return funcs;
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
      _bin: mod,
      name: name,
      funcs: getFuncs(mod)
    };

    debug('loaded ' + name);
  }
  return modules;
};

var Facade = exports.Facade = function (loadModulePath) {
  this.modules = loadModules(loadModulePath);
};

Facade.prototype.getModule = function (moduleName) {
  return this.modules[moduleName];
};

Facade.prototype.getFunc = function (mod, funcName) {
  return mod.funcs[funcName];
};

Facade.prototype.exec = function (moduleName, funcName, argv, cb) {
  var mod = this.getModule(moduleName);
  if (mod) {
    var func = this.getFunc(mod, funcName);
    if (func) {
      var argsLen = func.args.length;
      if (argv.length > argsLen) {
        argv = argv.slice(0, argsLen);
      }
      argv.push(cb);
      func.f.apply(this, argv);
      return;
    }
  }
  throw { err: 'Not Found', module: moduleName, func: funcName };
};

