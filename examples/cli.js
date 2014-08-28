#!/usr/bin/env node
var facade = new require('../');

facade.run(function(res){
  if (res) {
    console.log(res);
  } else {
    console.log("Done");
  }
});

