#!/usr/bin/env node

if (require.main === module) {
  var facade = new require('../');

  facade.cli.run(function(res){
    if (res) {
      console.log(res);
    } else {
      console.log("Done");
    }
  });
}
