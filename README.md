# slackbotnode
Main node for the slackbot node network.

======
This project is part a slackbot node network.

It is the main node. It connects to slack via a bot and sends commands to the registered client nodes.

## Start
1. To start the main node you have to enter your slack bot token to the `config.json`. (To create a bot please see [Creating a new bot](https://my.slack.com/services/new/bot) )
2. Run ```npm install```
3. Run ```node app.js```
4. Have fun!

## Client
You can find the client node lib at https://github.com/duglah/nodeclient and an example for how to use the client at https://github.com/duglah/testnode .

### Other clients
If you would like to control a rgb led strip via your slackbot you should check out https://github.com/duglah/rgbnode .
It is a node which recieves commands from slack and sends them to the [rgb-pi](https://github.com/ryupold/rgb-pi)
(Nice project!) server.

## Todos
* Register on ping events
* Write documentation
* Clean up code

## License
```
The MIT License (MIT)

Copyright (c) 2016 Philipp Geitz-Manstein

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
