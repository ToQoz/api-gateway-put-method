var assign = require('object-assign');

var makePatchOperations = require('aws-make-patch-operations');

module.exports = function(apiGateway, params, cb) {
  params = assign({}, params);

  var dryRun = params.dryRun;
  delete params.dryRun;

  if (!Array.isArray(params.methods)) {
    params.methods = [params.methods];
  }
  var methods = params.methods;
  delete params.methods;

  var deleteOthers = params.deleteOthers && function(putResult, existingMethods, cb) {
    var puttedMethods = methods.map(function(method) { return method.httpMethod; });
    del(arraySubtract(existingMethods, puttedMethods), function(err, data) {
      if (err) {
        cb(err, null);
      } else {
        var operations = putResult.operations.concat(data.operations);
        cb(null, {items: putResult.items, operations: operations, deletedItems: data.items});
      }
    });
  };
  delete params.deleteOthers;

  list(function(err, existingMethods) {
    if (err) {
      cb(err, null)
    } else {
      put(methods, existingMethods, function(err, data) {
        if (err) {
          cb(err, null);
        } else if (!deleteOthers) {
          cb(null, data);
        } else {
          deleteOthers(data, existingMethods, cb);
        }
      });
    }
  });

  function list(cb) {
    _list(
      apiGateway,
      {
        restApiId: params.restApiId,
        resourceId: params.resourceId,
      },
      dryRun,
      cb
    )
  }

  function del(methods, cb) {
    if (methods.length === 0) {
      return cb(null, {operations: [], items: []});
    }

    var next = function(err, data) {
      if (err) return cb(err, null);

      del(methods.slice(1), function(err, nextData) {
        if (err) {
          cb(err, null);
        } else {
          var operations = data.operations.concat(nextData.operations);
          var items = data.items.concat(nextData.items);
          cb(null, {operations: operations, items: items});
        }
      });
    };

    _del(
      apiGateway,
      {
        restApiId: params.restApiId,
        resourceId: params.resourceId,
        httpMethod: methods[0],
      },
      dryRun,
      next
    )
  }

  function put(targetMethods, existingMethods, cb) {
    if (targetMethods.length === 0) {
      return cb(null, {items: [], operations: []});
    }

    var next = function(err, data) {
      if (err) return cb(err, null);

      put(targetMethods.slice(1), existingMethods, function(err, nextData) {
        if (err) {
          cb(err, null);
        } else {
          var items = data.items.concat(nextData.items);
          var operations = data.operations.concat(nextData.operations);
          cb(null, {items: items, operations: operations});
        }
      });
    };

    var itemParams = assign({}, targetMethods[0], params);
    if (existingMethods.indexOf(itemParams.httpMethod) !== -1) {
      _update(apiGateway, itemParams, dryRun, next);
    } else {
      _create(apiGateway, itemParams, dryRun, next);
    }
  }
};

function _list(apiGateway, params, dryRun, cb) {
  // only use keys of .resourceMethod
  // c.f. https://github.com/aws/aws-sdk-js/issues/764
  apiGateway.getResource(params, function(err, res) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, res.resourceMethods ? Object.keys(res.resourceMethods) : []);
    }
  });
}

function _del(apiGateway, params, dryRun, cb) {
  var operation = {
    op: 'apiGateway.deleteMethod',
    params: params,
    message: 'apiGateway: delete method ' + params.httpMethod + ' (resourceId=' + params.resourceId + ')',
  };

  if (dryRun) {
    operations.message = '(dryrun) ' + message,
    cb(null, {operations: [operation], items: []});
  } else {
    apiGateway.deleteMethod(
      params,
      function(err) {
        var data = {httpMethod: params.httpMethod};
        cb(err, {operations: [operation], items: [data]});
      }
    );
  }
}

function _create(apiGateway, params, dryRun, cb) {
  var operation = {
    op: 'apiGateway.putMethod',
    params: params,
    message: 'apiGateway: put method ' + params.httpMethod + ' (resourceId=' + params.resourceId + ')',
  };

  if (dryRun) {
    operations.message = '(dryrun) ' + message,
    cb(null, {operations: [operation], items: []});
  } else {
    apiGateway.putMethod(params, function(err, data) {
      cb(err, {operations: [operation], items: [data]});
    });
  }
}

function _update(apiGateway, params, dryRun, cb) {
  var idendifiers = {
    restApiId: params.restApiId,
    resourceId: params.resourceId,
    httpMethod: params.httpMethod,
  };

  apiGateway.getMethod(idendifiers, function(err, data) {
    if (err) {
      cb(err, null);
    } else {
      // idendifiers never have changes
      // methodResponses and methodIntegration can't be patched
      var patchables = ['authorizationType', 'apiKeyRequired', 'authorizerId', 'requestModels', 'requestParameters'];
      var patchOperations = makePatchOperations(objectFilter(data, patchables), objectFilter(params, patchables));
      if (patchOperations.length > 0) {
        params = assign({}, idendifiers, {patchOperations: patchOperations});

        var operation = {
          op: 'apiGateway.updateMethod',
          params: params,
          message: 'apiGateway: update method ' + params.httpMethod + ' (resourceId=' + params.resourceId + ')',
        };
        if (dryRun) {
          operations.message = '(dryrun) ' + message,
          cb(null, {operations: [operation], items: []});
        } else {
          apiGateway.updateMethod(params, function(err, data) {
            cb(err, {operations: [operation], items: [data]});
          });
        }
      } else {
        if (dryRun) {
          cb(null, {operations: [], items: []});
        } else {
          cb(null, {operations: [], items: [data]});
        }
      }
    }
  });
}

function arraySubtract(aa, ba) {
  return aa.filter(function(a) { return ba.indexOf(a) === -1; })
}

function objectFilter(obj, keys) {
  return Object.keys(obj).reduce(function(acc, k) {
    if (keys.indexOf(k) !== -1) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}
