exports.cliModule = true;

var ls = exports.ls = function(dir, cb) {
  if (typeof(dir) === 'function') {
    cb = dir;
    dir = null;
  }
  dir = dir || __dirname;
  var fs = require('fs');
  fs.readdir(dir, function(err, files) {
    if (err) {
      throw err; // will be caught by facade
    } else {
      cb({
        dir: dir,
        files: files
      })
    }
  });
};

if (require.main === module) {
  ls(process.argv[2]);
}

