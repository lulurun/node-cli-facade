exports.cliModule = true;

var myName = "cmd_module";

var method0 = exports.method0 = function(cb) {
  console.log(myName + ".method0");
  cb();
};

var method1 = exports.method1 = function(arg1, cb) {
  console.log(myName + ".method1", arg1);
  cb();
};

var method2 = exports.method2 = function(arg1, arg2, cb) {
  console.log(myName + ".method2", arg1, arg2);
  cb();
};

var method1 = exports.method3 = function(arg1, arg2, arg3, cb) {
  console.log(myName + ".method3", arg1, arg2, arg3);
  cb();
};

