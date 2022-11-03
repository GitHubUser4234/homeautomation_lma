var https = require('https');
exports.handler = function (request, context){
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEBUG:", "Discover request",  JSON.stringify(request));
        handleDiscovery(request, context, "");
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
            log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
            handlePowerControl(request, context);
        }
    }
    else if (request.directive.header.namespace === 'Alexa.Authorization' && request.directive.header.name === 'AcceptGrant') {
        handleAuthorization(request, context);
    }

    function handleAuthorization(request, context) {
        // Send the AcceptGrant response
        var payload = {};
        var header = request.directive.header;
        header.name = "AcceptGrant.Response";
        log("DEBUG", "AcceptGrant Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function handleDiscovery(request, context) {
        // Send the discovery response
        var payload = {
            "endpoints":
            [
                {
                    "endpointId": "sample-bulb-01",
                    "friendlyName": "Livingroom lamp",
                    "displayCategories": ["LIGHT"],
                    "cookie": {
                        "auth": "IwEBINfd5Ai0umwHOyQ_E8-Me1O"
                    },
                    "capabilities":
                    [
                        {
                            "interface": "Alexa.PowerController",
                            "version": "3",
                            "type": "AlexaInterface",
                            "properties": {
                                "supported": [{
                                    "name": "powerState"
                                }],
                                 "retrievable": true
                            }
                        },
                        {
                        "type": "AlexaInterface",
                        "interface": "Alexa.EndpointHealth",
                        "version": "3.2",
                        "properties": {
                            "supported": [{
                                "name": "connectivity"
                            }],
                            "retrievable": true
                        }
                    },
                    {
                        "type": "AlexaInterface",
                        "interface": "Alexa",
                        "version": "3"
                    }
                    ]
                }
            ]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }
	



    async function handlePowerControl(request, context) {
        // get device ID passed in during discovery
        var requestMethod = request.directive.header.name;
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.name = "Response";
        responseHeader.messageId = responseHeader.messageId + "-R";
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;
        var powerResult;

        if (requestMethod === "TurnOn") {

            // Make the call to your device cloud for control
            await sendToCloud(requestToken, request);
            powerResult = "ON";
        }
       else if (requestMethod === "TurnOff") {
            // Make the call to your device cloud for control and check for success
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "OFF";
        }
        // Return the updated powerState.  Always include EndpointHealth in your Alexa.Response
        // Datetime format for timeOfSample is ISO 8601, `YYYY-MM-DDThh:mm:ssZ`.
        var contextResult = {
            "properties": [{
                "namespace": "Alexa.PowerController",
                "name": "powerState",
                "value": powerResult,
                "timeOfSample": "2022-09-03T16:20:50.52Z", //retrieve from result.
                "uncertaintyInMilliseconds": 50
            },
            {
                "namespace": "Alexa.EndpointHealth",
                "name": "connectivity",
                "value": {
                "value": "OK"
            },
            "timeOfSample": "2022-09-03T22:43:17.877738+00:00",
            "uncertaintyInMilliseconds": 0
            }]
        };
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: requestToken
                    },
                    endpointId: "sample-bulb-01"
                },
                payload: {}
            }
        };
        log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
        context.succeed(response);
    }
};

	var sendToCloud = function(token, request) {
  return new Promise(function(resolve, reject) {
      var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic hidden_in_question"
      };

      var options = {
        host: "www.arwensoft.com",
        port: 443,
        path: "/ha/test.php",
        method: "POST",
        headers: headers
      };
	  
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      var req = https.request(options, function(res) {  
        res.on('data', function(request) {
          console.log("rep:");
          console.log(JSON.parse(request));
        });
        res.on('end', resolve);
      });

      req.on('error', function(e) {
        console.log("ERROR:");
        console.log(e);
        reject(e);
      });

      req.write(JSON.stringify(request));
      req.end();
  });
};