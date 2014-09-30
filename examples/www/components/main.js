F('main', F.defaultEnv.components.Router.extend({
  getComponentName: function(changedQuery, cb) {
    cb(F.query.page || 'help');
  },
}));
