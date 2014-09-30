var fs = require('fs');
var path = require('path');
var util = require('util');
var debug = require('debug')('cli-facade');

var ModuleBase = exports.ModuleBase = (function(){
  var base = function(){};

  base.prototype.main = function(){
    throw new Error('to be implemented');
  };

  return base;
})();

var initHelp = function(facade){
  var helpFuncs = function(mod) {
    var res = [];
    for (var i in mod) {
      var func = mod[i];
      if (typeof(func) === 'function' && typeof(func.prototype.main) === 'function') {
        var funcOptions = func.options || {};
        var options = [];
        for (var x in funcOptions) {
          options.push({
            name: x,
            type: typeof(funcOptions[x]),
            default: funcOptions[x]
          });
        }
        res.push({ name: i, options: options });
      }
    }
    return res;
  };

  function all(){
    ModuleBase.call(this);
  };
  all.template = 'Usage:\n' +
    '{{node}} {{script}} $moduleName $functionName [$options]\n\n' +
    'Available modules:\n' +
    '{{#modules}}' +
    '\n\n' +
    '[{{moduleName}}]\n' +
    '{{#funcs}}' +
    '  {{node}} {{script}} {{moduleName}} {{name}} ' +
    '{{#options}}--{{name}} ${{name}} {{/options}}\n' +
    '{{/funcs}}' +
    '\n' +
    '{{/modules}}';
  util.inherits(all, ModuleBase);
  all.prototype.main = function(opt, cb){
    var res = { node: facade.node, script: facade.script, modules: [] };
    for (var i in facade.modules) {
      res.modules.push({moduleName: i, funcs: helpFuncs(facade.modules[i])});
    }
    cb(res);
  };

  function _module(){
    ModuleBase.call(this);
  };
  _module.template = 'Usage of [{{moduleName}}]:\n' +
    '{{#funcs}}' +
    '  {{node}} {{script}} {{moduleName}} {{name}} ' +
    '{{#options}}--{{name}} ${{name}} {{/options}}\n' +
    '{{/funcs}}\n';
  _module.options = { name: '' };
  util.inherits(_module, ModuleBase);
  _module.prototype.main = function(opt, cb){
    var moduleName = opt.name;
    if (!(moduleName in facade.modules)) throw new Error('unknown module: ' + moduleName);
    var mod = facade.modules[moduleName];
    var res = { node: facade.node, script: facade.script, moduleName: moduleName };
    res.funcs = helpFuncs(mod);
    cb(res);
  };

  return { all: all, module: _module };
};

exports.Facade = (function(){
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

  var loadModules = function(loadModulePath) {
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

      modules[name] = mod;

      debug('loaded ' + name);
    }
    return modules;
  };

  var Facade = function (loadModulePath) {
    this.modules = loadModules(loadModulePath);
    this.modules.help = initHelp(this);
  };

  Facade.prototype.getModule = function (moduleName) {
    return this.modules[moduleName];
  };

  Facade.prototype.exec = function (moduleName, funcName, options, cb) {
    var mod = this.getModule(moduleName);
    if (mod) {
      if (funcName in mod) {
        var func = mod[funcName];
        for (var i in func.options) {
          if (!(i in options)) options[i] = func.options[i];
        }
        (new func()).main(options, function(res){
          cb(func, res);
        });
        return;
      }
    }
    throw { err: 'Not Found', module: moduleName, func: funcName };
  };

  return Facade;
})();

