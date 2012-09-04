var io = require('socket.io-client')
  , config = require('./config.json');

var socket = io.connect('http://localhost:3002');
socket.on('connect_failed', function(){
  console.log('Connection Failed');
});
socket.on('connect', function(){
  console.log('Connected');
  if (!config.auto) doNext(); else doAutoNext();
});
socket.on('disconnect', function () {
  console.log('Disconnected');
  process.exit();
});
function doNext() {
  socket.send('join ' + config.name);
  var commands = [];
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on("data", function(data) {
    data = data.replace(/\n/, '');
    if (data == "end") {
      socket.send("turn " + JSON.stringify(commands));
      commands = [];
    }
    else {
      var splitted = data.split(' ');
      var cmd = splitted.splice(0, 1)[0];
      commands.push({cmd: cmd, args: splitted});
    }
  });
  socket.on('message', function(data) {
    data = data + " ";
    var space = data.indexOf(" ");
    var cmd = data.substring(0, space);
    var args = data.substring(space+1);
    console.log();
    console.log("<-- " + cmd);
    console.log("    " +args);
    console.log();
  });
}

function doAutoNext() {
  socket.send('join ' + config.name);
  socket.on('message', function(data) {
    data = data + " ";
    var space = data.indexOf(" ");
    var cmd = data.substring(0, space).trim();
    var args = data.substring(space+1);
    console.log();
    console.log("<-- " + cmd);
    console.log("    " +args);
    console.log();
    if (cmd == "turn") {
      var state = JSON.parse(args);
      var did = state.dogs[0].id;
      setTimeout(function() {
        socket.send('turn [{"cmd": "move", "args": [' + did + ', -1, 0]}]');
      }, 50);
    }
  });
}