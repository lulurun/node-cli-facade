F('result', F.Component.extend({
  template: '',
  Public: {
    load: function(data) {
      this.load(data);
    }
  },
  getData: function(cb, param) {
    var self = this;
    if (!param) return cb();
    var moduleName = self.$container.data('module') || F.query.module;
    var functionName = self.$container.data('function') || F.query.func;
    if (!moduleName || !functionName) {
      throw new Error('missing module/function name');
    }
    var templateQuery = moduleName + '/' + functionName + '.tmpl';
    self.require(templateQuery, function(data){
      self.template = self.F.Template.Compile(data);
      self.data = param.data;
      self.data.env = self.F.getName();
      cb();
    });
  }
}));

