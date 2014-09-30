F(function(){
  var getFuncs = (function(){
    var funcByName = null;
    return function(self, cb){
      if (funcByName) return cb(funcByName);
      self.require('api/help/all', function(data){
        funcByName = {};
        var modules = data.data.modules;
        modules.forEach(function(m){
          m.funcs.forEach(function(f){
            funcByName[m.moduleName + '.' + f.name] = {
              moduleName: m.moduleName,
              functionName: f.name,
              options: f.options
            };
          });
        });
        cb(funcByName);
      });
    };
  })();

  function post(path, object, cb) {
    var method = "POST";
    var contentType = "application/json";

    var xhr = new XMLHttpRequest();
    xhr.open(method, path, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        var data = JSON.parse(xhr.responseText);
        cb(data);
      }
    }
    xhr.setRequestHeader('Content-Type', contentType);
    object = object || {};
    var text = JSON.stringify(object);
    xhr.send(text);
  };

  F('form', F.Component.extend({
    onHashChanged: function(data) {
      if (data.module || data.func) {
        this.load();
      }
    },
    afterRender: function(cb){
      var self = this;
      self.$('.btn-exec').click(function(){
        var body = {};
        self.$('.form-control').each(function(){
          var $this = $(this);
          var name = $this.data('name');
          var value = $this.val();
          body[name] = value;
        });
        var apiUrl = self.F.APIRoot + 'api/' + self.moduleName + '/' + self.functionName;
        post(apiUrl, body, function(data){
          self.call('result.load', data);
        });
      });
      cb();
    },
    getData: function(cb) {
      var self = this;
      self.moduleName = self.$container.data('module') || F.query.module;
      self.functionName = self.$container.data('function') || F.query.func;
      if (!self.moduleName || !self.functionName) {
        throw new Error('missing module/function name');
      }
      getFuncs(self, function(funcs){
        var key = self.moduleName + '.' + self.functionName;
        if (!(key in funcs)) {
          throw new Error('module/function not found: ' + key);
        }
        self.data = funcs[key];
        cb();
      });
    }
  }));
});
