// -*- coding: utf-8 -*-

// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

// Licensed under the Amazon Software License (the "License"). You may not use this file except in
// compliance with the License. A copy of the License is located at

//    http://aws.amazon.com/asl/

// or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific
// language governing permissions and limitations under the License.

'use strict';
let https = require('https');
let AWS = require('aws-sdk');
AWS.config.update({region:'xxxxxxx'});

let AlexaResponse = require("./alexa/skills/smarthome/AlexaResponse");


exports.handler = async function (event, context) {

    // Dump the request for logging - check the CloudWatch logs
    console.log("index.handler request  -----");
    console.log(JSON.stringify(event));

    if (context !== undefined) {
        console.log("index.handler context  -----");
        console.log(JSON.stringify(context));
    }

    // Validate we have an Alexa directive
    if (!('directive' in event)) {
        let aer = new AlexaResponse(
            {
                "name": "ErrorResponse",
                "payload": {
                    "type": "INVALID_DIRECTIVE",
                    "message": "Missing key: directive, Is request a valid Alexa directive?"
                }
            });
        return sendResponse(aer.get());
    }

    // Check the payload version
    if (event.directive.header.payloadVersion !== "3") {
        let aer = new AlexaResponse(
            {
                "name": "ErrorResponse",
                "payload": {
                    "type": "INTERNAL_ERROR",
                    "message": "This skill only supports Smart Home API version 3"
                }
            });
        return sendResponse(aer.get());
    }

    let namespace = ((event.directive || {}).header || {}).namespace;

    if (namespace.toLowerCase() === 'alexa.authorization') {
        let aar = new AlexaResponse({"namespace": "Alexa.Authorization", "name": "AcceptGrant.Response",});
        return sendResponse(aar.get());
    }

    if (namespace.toLowerCase() === 'alexa.discovery') {
		let respBody;
		await sendToHomeServer(event.directive.payload.scope.token, event, "xxx2").then(function(body) {

			respBody = body;
		});
		//console.log("discovery continuing");
		
        let adr = new AlexaResponse({"namespace": "Alexa.Discovery", "name": "Discover.Response"});
        let capability_alexa = adr.createPayloadEndpointCapability();
        let capability_alexa_powercontroller = adr.createPayloadEndpointCapability(
			{
				"interface": "Alexa.PowerController", 
				 "version": "3",
			 "supported": 
				[
				{"name": "powerState"}
				]
			}
		);
		let capability_alexa_scenecontroller = adr.createPayloadEndpointCapability(
			{
				"interface": "Alexa.SceneController", 
				 "version": "3",
				"supportsDeactivation": false
			}
		);
 
		for (const scene of respBody["scenes"]) { 
			adr.addPayloadEndpoint({"friendlyName": scene.name, "endpointId": scene.id, "displayCategories": ["SCENE_TRIGGER"], "capabilities": [capability_alexa, capability_alexa_scenecontroller]});
		}
		for (const room of respBody["rooms"]) { 
			let roomName = room.name;
			
			for (const dev of room["devs"]){
				let devName = dev.name;
				let category = dev.cat;
				if(category!='INTERIOR_BLIND'){
					adr.addPayloadEndpoint({"friendlyName": roomName+" "+dev.name, "endpointId": dev.id, "displayCategories": [category], "capabilities": [capability_alexa, capability_alexa_powercontroller]});
				} else{
					adr.addPayloadEndpoint({"friendlyName": roomName+" "+dev.name, "endpointId": dev.id, "displayCategories": [category], "capabilities": [capability_alexa, createAlexaTogglecontroller(adr, dev.id, roomName+" "+dev.name)]});
				}
			}
		}
        
        return sendResponse(adr.get());
    }

    if (namespace.toLowerCase() === 'alexa.powercontroller' || namespace.toLowerCase() === 'alexa.togglecontroller'|| namespace.toLowerCase() === 'alexa.scenecontroller') {
		let endpoint_id = event.directive.endpoint.endpointId;
        let token = event.directive.endpoint.scope.token;
        let correlationToken = event.directive.header.correlationToken;
        let power_state_value = "OFF";
        if (event.directive.header.name === "TurnOn" || event.directive.header.name === "Activate")
            power_state_value = "ON";
		
		await sendToCloud(token, event, "pow");



        let ar = new AlexaResponse(
            {
                "correlationToken": correlationToken,
                "token": token,
                "endpointId": endpoint_id
            }
        );
        ar.addContextProperty({"namespace":"Alexa.PowerController", "name": "powerState", "value": power_state_value});

        // Check for an error when setting the state
        let state_set = sendDeviceState(endpoint_id, "powerState", power_state_value);
        if (!state_set) {
            return new AlexaResponse(
                {
                    "name": "ErrorResponse",
                    "payload": {
                        "type": "ENDPOINT_UNREACHABLE",
                        "message": "Unable to reach endpoint database."
                    }
                }).get();
        }

        return sendResponse(ar.get());
    }

};

function createAlexaTogglecontroller(adr, endpointId, friendlyName) {
	return adr.createPayloadEndpointCapability(
			{
				"type": "AlexaInterface",
				"interface": "Alexa.ToggleController", 
				"instance": endpointId,
				 "version": "3",
				"supported": [
						{
							"name": "toggleState"
						}
					],
				"actionMappings": [
						{
							"@type": "ActionsToDirective",
							"actions": [
								"Alexa.Actions.Close"
							],
							"directive": {
								"name": "TurnOff",
								"payload": {}
							}
						},
						{
							"@type": "ActionsToDirective",
							"actions": [
								"Alexa.Actions.Open"
							],
							"directive": {
								"name": "TurnOn",
								"payload": {}
							}
						}
					],
					"stateMappings": [
						{
							"@type": "StatesToValue",
							"states": [
								"Alexa.States.Closed"
							],
							"value": "OFF"
						},
						{
							"@type": "StatesToValue",
							"states": [
								"Alexa.States.Open"
							],
							"value": "ON"
						}
					],
					"friendlyNames": [
					  {
						"@type": "text",
						"value": {
						  "text": friendlyName,
						  "locale": "en-US"
						}
					  }
					]
			}
		);
}

function sendResponse(response)
{
    // TODO Validate the response
    console.log("index.handler response -----");
    console.log(JSON.stringify(response));
    return response;
}

function sendDeviceState(endpoint_id, state, value) {
    let dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    let key = state + "Value";
    let attribute_obj = {};
    attribute_obj[key] = {"Action": "PUT", "Value": {"S": value}};

    let request = dynamodb.updateItem(
        {
            TableName: "SampleSmartHome",
            Key: {"ItemId": {"S": endpoint_id}},
            AttributeUpdates: attribute_obj,
            ReturnValues: "UPDATED_NEW"
        });

    console.log("index.sendDeviceState request -----");
    console.log(request);

    let response = request.send();

    console.log("index.sendDeviceState response -----");
    console.log(response);
    return true;
}


	var sendToHomeServer = function(token, request, target) {
  return new Promise(function(resolve, reject) {
      var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic xxx"
      };

      var options = {
        host: "xxx.xxx.xxx",
        port: 000,
        path: "xxxx",
        method: "POST",
        headers: headers
      };
	  
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      var req = https.request(options, function(res) {  
        var body = [];
            res.on('data', function(chunk) {
				 body.push(chunk);
            });
        res.on('end', function() {
                try {
					console.log("Buffer.concat(body): "+Buffer.concat(body));
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e);
                }
                resolve(body);
            });
      });

      req.on('error', function(e) {
        console.log("ERROR:");
        console.log(e);
        reject(e);
      });

      req.write(JSON.stringify(request));
      req.end();
	  console.log("sendToHomeServer end");
  });
};
