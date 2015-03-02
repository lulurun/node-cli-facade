exports.ls = {
  view: {
    template: 'Entries in {{dir}}:\n{{#items}}  {{.}}\n{{/items}}',
  },
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

// ////////
// ./cli demo printOpts --a 1 --b 2 --c 5.0 --ver 5.0
exports.printOpts = function(opt, cb) {
  cb(opt);
};

exports.hiddenFunction = {
  hidden: true,
  main: function(){
    throw new Error("I am hidden");
  },
};

exports.facadeModule = true;


