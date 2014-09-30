var util = require('util');
var ModuleBase = require(__dirname + '/../../').ModuleBase;

exports.ls = (function(){
  var ls = function(){
    ModuleBase.call(this);
  };
  ls.template = 'Entries in {{dir}}:\n{{#items}}  {{.}}\n{{/items}}';
  ls.options = {
    dir: __dirname,
  };

  util.inherits(ls, ModuleBase);

  ls.prototype.main = function(opt, cb){
    var dir = opt.dir;
    var fs = require('fs');
    fs.readdir(dir, function(err, files) {
      if (err) {
        throw err; // will be caught by facade
      } else {
        cb({
          dir: dir,
          items: files
        })
      }
    });
  };

  return ls;
})();

exports.facadeModule = true;

