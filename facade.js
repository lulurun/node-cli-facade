var fs = require('fs');
var path = require('path');
var debug = require('debug')('cli-facade');

var createFunction = function(def) {
  if (typeof(def) === 'function') {
    return { main: def };
  } else if (typeof(def) === 'object'){
    return def;
  }
  return null;
};

exports.Facade = (function(){
  var loadFiles = function(loadPath) {
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

  var Facade = function(loadModulePath) {
    this.modules = {};

    loadModulePath = path.resolve(loadModulePath);
    var modules = {};
    debug('load cli modules from ' + loadModulePath);
    var files = loadFiles(loadModulePath);
    var i = 0, len = files.length;
    for (; i<len; ++i) {
      var f = files[i];
      var mod = require(f);
      if (!mod.facadeModule) continue;
      var r = path.relative(loadModulePath, f);
      var dir = path.dirname(r);
      var base = path.basename(r, '.js');
      name = (dir === "." ? "" : dir.replace(/\//g, ".") + ".") + base;

      this.addModule(name, mod);
    }
    this.addModule('help', require(__dirname + '/help'));
  };

  Facade.prototype.addModule = function(name, mod) {
    var funcs = {};
    for (var j in mod) {
      var f = createFunction(mod[j]);
      if (f) { funcs[j] = f; }
    }
    for (var x in funcs) {
      debug('add module: ' + name);
      this.modules[name] = funcs;
      return;
    }
    debug('no function found in ' + name);
  };

  Facade.prototype.getModule = function(name) {
    return this.modules[name];
  };

  Facade.prototype.getFunction = function(moduleName, functionName) {
    var mod = this.getModule(moduleName);
    return mod ? mod[functionName] : null;
  };

  Facade.prototype.exec = function(moduleName, funcName, options, cb) {
    var mod = this.getModule(moduleName);
    if (mod) {
      if (funcName in mod) {
        var f = mod[funcName];
        for (var i in f.options) {
          if (!(i in options)) options[i] = f.options[i];
        }
        f.main.bind(this)(options, function(res){
          cb(res);
        });
        return;
      }
    }
    throw { err: 'Not Found', module: moduleName, func: funcName };
  };

  return Facade;
})();

