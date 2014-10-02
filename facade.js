var fs = require('fs');
var path = require('path');
var debug = require('debug')('cli-facade');

var createFunction = exports.createFunction = function(main, options, template){
  return {
    main: main,
    options: options,
    template: template,
  };
};

var help = (function(){
  var helpFuncs = function(mod) {    var res = [];
    for (var i in mod) {
      var func = mod[i];
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
    return res;
  };

  return {
    all: createFunction(
      function(opt, cb){
        var res = { node: this.node, script: this.script, modules: [] };
        for (var i in this.modules) {
          res.modules.push({moduleName: i, funcs: helpFuncs(this.modules[i])});
        }
        cb(res);
      },
      {},
      'Usage:\n' +
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
        '{{/modules}}'
    ),
    module: createFunction(
      function(opt, cb){
        var moduleName = opt.name;
        if (!(moduleName in this.modules)) throw new Error('unknown module: ' + moduleName);
        var mod = this.modules[moduleName];
        var res = { node: this.node, script: this.script, moduleName: moduleName };
        res.funcs = helpFuncs(mod);
        cb(res);
      },
      { name: '' },
      'Usage of [{{moduleName}}]:\n' +
        '{{#funcs}}' +
        '  {{node}} {{script}} {{moduleName}} {{name}} ' +
        '{{#options}}--{{name}} ${{name}} {{/options}}\n' +
        '{{/funcs}}\n'
    ),
  };
})();

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

  var Facade = function (loadModulePath) {
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

      var funcs = {};
      for (var i in mod) {
        var f = mod[i];
        if (typeof(f) === 'function') {
          funcs[i] = createFunction(f);
        } else if (typeof(f === 'object') && f.main && typeof(f.main) === 'function') {
          funcs[i] = createFunction(f.main, f.options, f.template);
        }
      }
      for (var i in funcs) {
        this.addModule(name, funcs);
        break;
      }
    }
    this.addModule('help', help);
  };

  Facade.prototype.addModule = function (name, mod) {
    debug('loaded module: ' + name);
    this.modules[name] = mod;
  };

  Facade.prototype.getModule = function (name) {
    return this.modules[name];
  };

  Facade.prototype.exec = function (moduleName, funcName, options, cb) {
    var mod = this.getModule(moduleName);
    if (mod) {
      if (funcName in mod) {
        var f = mod[funcName];
        for (var i in f.options) {
          if (!(i in options)) options[i] = f.options[i];
        }
        f.main.bind(this)(options, function(res){
          cb(f, res);
        });
        return;
      }
    }
    throw { err: 'Not Found', module: moduleName, func: funcName };
  };

  return Facade;
})();

