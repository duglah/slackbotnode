"use strict";
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var app = express();
var botkit = require('botkit');
var os = require('os');
var bodyParser = require('body-parser');
var config = require('../config.json');
var defaultNodePort = "8085";
var defaultMainNodePort = "8080";
var controlsCommands = [];
var defaultNodeTimeout = 1000 * 30;
var controller = botkit.slackbot();
var bot = controller.spawn({
    token: config.slackbot_token
});
bot.startRTM(function (err, bot, payload) {
    if (err)
        throw new Error('Could not connect slack!');
});
controller.on(['direct_message', 'direct_mention'], function (bot, message) {
    if (controlsCommands.length == 0 && message.text == null)
        return;
    var request = message.text.split(" ");
    controlsCommands.forEach(function (element) {
        if (element.command == request[0]) {
            if (request.length == 1)
                SendCommandToClient(element, request[0], "", function (error, data) {
                    if (!error && data && data.result)
                        bot.reply(message, data.result);
                });
            else {
                var parameters = message.text.substr(request[0].length + 1, message.text.length);
                console.log("Parameters: " + parameters);
                SendCommandToClient(element, request[0], parameters, function (error, data) {
                    if (!error && data && data.result)
                        bot.reply(message, data.result);
                });
            }
        }
    });
});
controller.hears(['uptime'], 'direct_message,direct_mention', function (bot, message) {
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());
    bot.reply(message, ':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');
});
controller.hears(['commands'], 'direct_message,direct_mention', function (bot, message) {
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
function formatUptime(uptime) {
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
var jsonParser = bodyParser.json();
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
function SendCommandToClient(controlsCommand, command, param, callback) {
    var commandObject = {
        command: command,
        param: param
    };
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
            }
            catch (e) {
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
    var indecesOfCommandsToClear = [];
    if (controlsCommands.length == 0)
        return;
    for (var i = controlsCommands.length - 1; i >= 0; i--) {
        var command = controlsCommands[i];
        if (command.ping < Date.now() - defaultNodeTimeout) {
            console.log("Command: " + command.command + " from " + command.host + " timed out");
            indecesOfCommandsToClear.push(i);
        }
    }
    indecesOfCommandsToClear.forEach(function (index) {
        controlsCommands.splice(index, 1);
    });
}
var server = app.listen(defaultMainNodePort, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("SlackBot app listening at http://%s:%s", host, port);
});
var interval = setInterval(ClearTimeoutNodes, defaultNodeTimeout);

//# sourceMappingURL=app.js.map