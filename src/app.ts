/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/request/request.d.ts" />

import express = require("express");
import {Server} from "http";
import request = require("request");
var bodyParser = require("body-parser");
var app = express();
var botkit = require('botkit');
var os = require('os');
var bodyParser = require('body-parser');
var config = require('../config.json');

var defaultNodePort = "8085";
var defaultMainNodePort = "8080";

var controlsCommands: Array<any> = [];

var defaultNodeTimeout = 1000 * 30; //1000 * 60 * 5; //5 minutes

//Setup bot
var controller = botkit.slackbot(); 

var bot = controller.spawn({
    token: config.slackbot_token
});

bot.startRTM((err: any, bot: any, payload: any) => {
    if (err)
        throw new Error('Could not connect slack!');
});

//Bot commands

//commands from nodes
controller.on(['direct_message', 'direct_mention'], (bot: any, message: any) => {
    if (controlsCommands.length == 0 && message.text == null)
        return;

    var request = message.text.split(" ");

    controlsCommands.forEach(function (element) {
        if (element.command == request[0]) {
            if (request.length == 1)
                SendCommandToClient(element, request[0], "", (error: any, data: any) => {
                    if (!error && data && data.result)
                        bot.reply(message, data.result);
                });
            else {
                var parameters = message.text.substr(request[0].length + 1, message.text.length);

                console.log("Parameters: " + parameters);

                SendCommandToClient(element, request[0], parameters, (error: any, data: any) => {
                    if (!error && data && data.result)
                        bot.reply(message, data.result);
                });
            }
        }
    });
});

//uptime
controller.hears(['uptime'], 'direct_message,direct_mention', (bot: any, message: any) => {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message, ':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');
});

//commands
controller.hears(['commands'], 'direct_message,direct_mention', (bot: any, message: any) => {
    if (controlsCommands.length == 0) {
        bot.reply(message, 'Oh, no commands registered :cold_sweat:');
        return;
    }

    var commandStr = "Available commands:\n";

    for (var i = 0; i < controlsCommands.length; i++) {
        commandStr += controlsCommands[i].command + "\n";
    }

    bot.reply(message, commandStr);
});

function formatUptime(uptime: number):string {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    return uptime + ' ' + unit;
}

//Setup Express
var jsonParser = bodyParser.json();

//REST commands

//register
app.post('/register', jsonParser, function (req, res) {
    console.log("/register called from Client: %s", req.connection.remoteAddress);

    if (!req.body) {
        console.error("Invalid json!");
        return res.sendStatus(400);
    }

    try {
        var commandObject = req.body;

        commandObject.ping = Date.now();

        if (!commandObject.command)
            throw new Error("No command!");

        if (!commandObject.port)
            commandObject.port = defaultNodePort;

        var adress = req.connection.remoteAddress;
        var adressParts = adress.split(":");

        commandObject.host = adressParts[adressParts.length - 1];

        controlsCommands.push(commandObject);
        res.status(200).end();
    }
    catch (err) {
        console.error(err);
        res.status(400).end(err);
    }
});

//ping
app.post('/ping', jsonParser, function (req, res) {
    console.log("/ping called from Client: %s", req.connection.remoteAddress);

    if (!req.body) {
        console.error("Invalid json!");
        return res.sendStatus(400);
    }

    try {
        var commandObject = req.body;

        if (!commandObject.command)
            throw new Error("No command!");

        var adress = req.connection.remoteAddress;
        var adressParts = adress.split(":");

        commandObject.host = adressParts[adressParts.length - 1];

        for (var i = 0; i < controlsCommands.length; i++) {
            if (controlsCommands[i].command == commandObject.command && controlsCommands[i].host == commandObject.host) {
                controlsCommands[i].ping = Date.now();
                res.status(200).end();
                return;
            }
        }

        console.error("Ping didn't found command!");
        res.status(400).end();
    }
    catch (err) {
        console.error(err);
        res.status(400).end(err);
    }
});

//Send command to client
function SendCommandToClient(controlsCommand:any, command:any, param:any, callback:any) {
    var commandObject = {
        command: command,
        param: param
    }

    var options = {
        uri: "http://" + controlsCommand.host + ":" + controlsCommand.port + "/command",
        method: 'POST',
        json: commandObject
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Send data to client: " + options.uri);

            try {
                if (body == null)
                    throw new Error("Invalid json");

                callback && callback(null, body);

            } catch (e) {
                console.error(e);
                callback && callback(e);
            }
        }
        else {
            console.error(error);
            callback && callback(error);
        }
    });
}

function ClearTimeoutNodes() {
    console.log("Clear timeout nodes");

    var indecesOfCommandsToClear:Array<any> = [];

    if (controlsCommands.length == 0)
        return;

    for (var i = controlsCommands.length - 1; i >= 0; i--) {
        var command = controlsCommands[i];
        if (command.ping < Date.now() - defaultNodeTimeout) {
            console.log("Command: " + command.command + " from " + command.host + " timed out");

            indecesOfCommandsToClear.push(i);
        }
    }

    indecesOfCommandsToClear.forEach((index:any) => {
        controlsCommands.splice(index, 1);
    });
}

//Start Server
var server = app.listen(defaultMainNodePort, ()=> {
    var host = server.address().address
    var port = server.address().port
    console.log("SlackBot app listening at http://%s:%s", host, port)
});

var interval = setInterval(ClearTimeoutNodes, defaultNodeTimeout);