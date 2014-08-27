exports.cliModule = true;

var method0 = exports.method0 = function(cb) {
  console.log("method0");
  cb();
};

var method1 = exports.method1 = function(arg1, cb) {
  console.log("method1", arg1);
  cb();
};

var method2 = exports.method2 = function(arg1, arg2, cb) {
  console.log("method2", arg1, arg2);
  cb();
};

var method1 = exports.method3 = function(arg1, arg2, arg3, cb) {
  console.log("method3", arg1, arg2, arg3);
  cb();
};

