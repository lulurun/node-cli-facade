var helpFuncs = function(mod) {
  var res = [];
  for (var i in mod) {
    var func = mod[i];
    if (func.hidden) continue;
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

var isHidden = function(mod) {
  var hidden = true;
  for (var i in mod) {
    if (!mod[i].hidden) {
      hidden = false;
      break;
    }
  }
  return hidden;
};

exports.all = {
  main: function(opt, cb){
    var res = { node: this.node, script: this.script, modules: [] };
    for (var i in this.modules) {
      var mod = this.modules[i];
      if (!isHidden(mod))
        res.modules.push({ moduleName: i, funcs: helpFuncs(mod) });
    }
    cb(res);
  },
  view: {
    template: 'Usage:\n' +
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
  },
};

exports.module = {
  main: function(opt, cb){
    var name = opt.name;
    if (!(name in this.modules) || isHidden(this.modules[name]))
      throw new Error('unknown module: ' + name);
    var mod = this.modules[name];
    var res = { node: this.node, script: this.script, moduleName: name };
    res.funcs = helpFuncs(mod);
    cb(res);
  },
  options: { name: '' },
  view: {
    template: 'Usage of [{{moduleName}}]:\n' +
      '{{#funcs}}' +
      '  {{node}} {{script}} {{moduleName}} {{name}} ' +
      '{{#options}}--{{name}} ${{name}} {{/options}}\n' +
      '{{/funcs}}\n'
  },
};

