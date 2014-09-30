F('help', F.Component.extend({
  afterRender: function(cb) {
    var self = this;
    self.require('/facade/api/help/all', function(data){
      self.call('facade:result.load', data);
    });
    cb();
  }
}));

