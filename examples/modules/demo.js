exports.ls = {
  template: 'Entries in {{dir}}:\n{{#items}}  {{.}}\n{{/items}}',
  options: { dir: __dirname, },
  main: function(opt, cb){
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
  },
};

exports.facadeModule = true;

