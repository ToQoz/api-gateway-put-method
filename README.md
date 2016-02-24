# api-gateway-put-method

creates or updates (or deletes) method of AWS APIGateway

## Usage

example.js:

```javascript
var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials({
  profile: 'org-stuff'
});
AWS.config.credentials = credentials;

var putMethod = require('api-gateway-put-method');

putMethod(
  new AWS.APIGateway({
    region: 'ap-northeast-1'
  }),
  {
    restApiId: 'xxx',
    resourceId: 'yyy',
    items: {
      httpMethod: 'POST',
      authorizationType: 'NONE',
      apiKeyRequired: false,
      requestParameters: {},
    },
    deleteOthers: false,
    dryRun: false,
  },
  function(err, data) {
    if (err) console.error(err);
    else console.log(JSON.stringify(data, null, 2));
  }
);
```

```
$ node ./example.js
{
  "items": [
    {
      "httpMethod": "POST",
      "authorizationType": "NONE",
      "apiKeyRequired": false,
      "requestParameters": {}
    }
  ],
  "operations": [
    {
      "op": "apiGateway.putMethod",
      "params": {
        "httpMethod": "POST",
        "authorizationType": "NONE",
        "apiKeyRequired": false,
        "requestParameters": {},
        "restApiId": "wjjfrvnpg9",
        "resourceId": "vihz7tjoi7"
      }
    }
  ],
  "deletedItems": []
}
$ sed -i'' -e 's/apiKeyRequired: *false,/apiKeyRequired: true,/g' example.js
$ node ./example.js
{
  "items": [
    {
      "httpMethod": "POST",
      "authorizationType": "NONE",
      "apiKeyRequired": true
    }
  ],
  "operations": [
    {
      "op": "apiGateway.updateMethod",
      "params": {
        "restApiId": "wjjfrvnpg9",
        "resourceId": "vihz7tjoi7",
        "httpMethod": "POST",
        "patchOperations": [
          {
            "op": "replace",
            "path": "/apiKeyRequired",
            "value": "true"
          }
        ]
      }
    }
  ],
  "deletedItems": []
}
$ node ./example.js
{
  "items": [
    {
      "httpMethod": "POST",
      "authorizationType": "NONE",
      "apiKeyRequired": true
    }
  ],
  "operations": [],
  "deletedItems": []
}
```

## API

```javascript
var putMethod = require('api-gateway-put-method')
```

### putFunction(apiGateway, params, cb)

This function creates or updates (or deletes) AWS API Gateway's resource if it doesn't exist.

- Arguments
  - apiGateway - **required** - `instance of AWS.APIGateway`
  - params - **required** - `map`
    - restApiId - **required** - `String`
    - resourceId - **required** - `String`
    - methods - **required** - `Array<map> | map`
      - httpMethod - **required** - `String`
      - authorizationType - **required** - `String`
      - authorizerId - `String`
      - apiKeyRequired - `Boolean`
      - requestModels - `map<String, String>`
      - requestParameters - `map<String, Boolean>`
    - dryRun - defaults to false - `Boolean`
    - deleteOthers - defaults to false - `Boolean`
  - cb - `function(err, data) {}` - called with following arguments on the end of operation
    - Arguments (cb)
      - err - `Error` - the error object from aws-sdk. Set to `null` if the operation is successful.
      - data - `map` - the data from aws-sdk. Set to `null` if the operation error occur.
        - items - `Array<map>` - the created or updated methods
          - httpMethod - `String`
          - authorizationType - `String`
          - authorizerId - `String`
          - apiKeyRequired - `Boolean`
          - requestModels - `map<String, String>`
          - requestParameters - `map<String, Boolean>`
          - methodResponses - `map<map>`
          - methodIntegration - `map<map>`
        - deletedItems - `Array<map>` - the deleted methods
          - httpMethod - `String`
          - authorizationType - `String`
          - authorizerId - `String`
          - apiKeyRequired - `Boolean`
          - requestModels - `map<String, String>`
          - requestParameters - `map<String, Boolean>`
          - methodResponses - `map<map>`
          - methodIntegration - `map<map>`
        - operations - `Array<map>`
          - op - `String` - like a `'apiGateway.putMethod'`
          - params - `map` - like a `{restApiId: 'xxx', resourceId: 'yyy', httpMethod: 'GET'}`
