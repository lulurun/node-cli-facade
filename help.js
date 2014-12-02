var helpFuncs = function(mod) {
  var res = [];
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

exports.all = {
  main: function(opt, cb){
    var res = { node: this.node, script: this.script, modules: [] };
    for (var i in this.modules) {
      res.modules.push({moduleName: i, funcs: helpFuncs(this.modules[i])});
    }
    cb(res);
  },
  options: {},
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
    var moduleName = opt.name;
    if (!(moduleName in this.modules)) throw new Error('unknown module: ' + moduleName);
    var mod = this.modules[moduleName];
    var res = { node: this.node, script: this.script, moduleName: moduleName };
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

