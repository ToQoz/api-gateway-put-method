var test = require('tape');

var applyPatchOps = require('aws-apply-patch-operations');

var putMethod = require('..');

function APIGateway() {
  this.methods = {};
};
APIGateway.prototype = {
  _method: function(httpMethod) {
    var returnAttrs = ["httpMethod", "authorizationType", "authorizerId", "apiKeyRequired", "requestModels", "requestParameters"];
    return objectFilter(this.methods[httpMethod], returnAttrs);
  },
  getResource: function(params, cb) {
    cb(null, {resourceMethods: this.methods});
  },
  getMethod: function(params, cb) {
    cb(null, this._method(params.httpMethod));
  },
  putMethod: function(params, cb) {
    this.methods[params.httpMethod] = params;
    cb(null, this._method(params.httpMethod));
  },
  updateMethod: function(params, cb) {
    this.methods[params.httpMethod] = applyPatchOps(this.methods[params.httpMethod], params.patchOperations);
    cb(null, this._method(params.httpMethod));
  },
  deleteMethod: function(params, cb) {
    delete this.methods[params.httpMethod];
    cb(null, {});
  },
};

test('create GET -> nop GET + create POST -> delete GET', function(t) {
  t.plan(6);

  var ag = new APIGateway();

  // create GET
  putMethod(ag, {restApiId: '', resourceId: '', methods: {httpMethod: "GET"}}, function(err, data) {
    t.deepEqual(data.items, [{httpMethod: "GET"}]);
    t.deepEqual(data.operations, [{op: 'apiGateway.putMethod', params: {restApiId: '', resourceId: '', httpMethod: "GET"}}]);

    // nop GET + create POST
    putMethod(ag, {restApiId: '', resourceId: '', methods: [{httpMethod: "GET"}, {httpMethod: "POST"}]}, function(err, data) {
      t.deepEqual(data.items, [{httpMethod: "GET"}, {httpMethod: "POST"}]);
      t.deepEqual(data.operations, [{op: 'apiGateway.putMethod', params: {restApiId: '', resourceId: '', httpMethod: "POST"}}]);

      // delete GET
      putMethod(ag, {deleteOthers: true, restApiId: '', resourceId: '', methods: {httpMethod: "POST"}}, function(err, data) {
        t.deepEqual(data.items, [{httpMethod: "POST"}]);
        t.deepEqual(data.operations, [{op: 'apiGateway.deleteMethod', params: {restApiId: '', resourceId: '', httpMethod: "GET"}}]);
      });
    });
  });
});

function objectFilter(obj, keys) {
  return Object.keys(obj).reduce(function(acc, k) {
    if (keys.indexOf(k) !== -1) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}
