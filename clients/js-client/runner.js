var AI = require('./src/ai')
  , bot = require('./src/bot')
  , common = require('./src/common')
  , SocketClient = require('./src/socket_client');

var args = process.argv.slice(2);
var argMap = {host: "localhost", port: 3002, name: "bot", count: 1};
for (var i = 0; i < args.length; i+=2) {
  argMap[args[i].substring(1)] = args[i+1];
}

function doRun(countLeft) {
  if (countLeft == 0) return;
  var socketClient = new SocketClient(argMap.host, argMap.port);
  var ai = new bot.Bot(socketClient);
  socketClient.on(common.Event.Finish, doRun.bind(null, countLeft-1));
  socketClient.start(argMap.name, argMap.hub);
}

doRun(argMap.count);

