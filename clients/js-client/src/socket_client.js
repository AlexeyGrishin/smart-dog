var net = require('net')
  , readline = require('readline')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , common = require('./common');

function SocketClient(host, port) {
  EventEmitter.call(this);
  this.host = host;
  this.port = port;
}

util.inherits(SocketClient, EventEmitter);

SocketClient.prototype.start = function(name, hub) {
  this.socket = new net.Socket();
  var remoteServer = readline.createInterface({
    input: this.socket,
    output: this.socket
  });
  remoteServer.on('line', function(data) {
    var cmdAndArg = data.replace(/\n$/, '');
    var space = cmdAndArg.indexOf(' ');
    var cmd = space > -1 ? cmdAndArg.substring(0, space).trim() : cmdAndArg;
    var arg = space > -1 ? cmdAndArg.substring(space).trim() : undefined;
    console.log("< " + cmdAndArg);
    switch (cmd) {
      case "wait":
        //ignore
        break;
      case "state":
        this.objects = [];
        break;
      case "obj":
        this.objects.push(JSON.parse("{" + arg + "}"));
        break;
      case "start":
        this.emit(common.Event.Init, JSON.parse("{" + arg + "}"));
        break;
      case "landscape":
        this.emit(common.Event.Landscape, JSON.parse("[" + arg + "]"));
        break;
      case "warning":
        space = arg.indexOf(" ");
        this.emit(common.Event.Warning, {
          id: arg.substring(0, space).trim(),
          warning: arg.substring(space).trim()
        });
        break;
      case "turn":
        this.emit(common.Event.Turn, this.objects);
        break;
      case "error":
        this.emit(common.Event.Error, arg);
        console.error("Error: " + arg);
        break;
      case "finished":
        this.emit(common.Event.Finish);
        break;
      default:
        this.emit(common.Event.Error, "Unexpected command: " + cmdAndArg);
        console.error("Unexpected command: " + cmdAndArg);
    }
  }.bind(this));
  this.socket.on('error', function(err) {
    console.error('Connection Failed - ' + err);
    remoteServer.close();
  });
  this.socket.on('close', function() {
    console.error('Connection Closed');
    remoteServer.close();
  });
  this.socket.connect(this.port, this.host, function() {
    console.log('Connected');
    this._send("join " + name + (hub ? " " + hub : ""));
  }.bind(this));
};

SocketClient.prototype["do"] = function(id, action, arg) {
  var send = ["do", id, action];
  if (arg) send.push(arg);
  this._send(send.join(" "));
};

SocketClient.prototype["end"] = function() {
  this._send("end");
};

SocketClient.prototype.disconnect = function() {
  this.socket.destroy();
};

SocketClient.prototype._send = function(cmd) {
  console.log("> " + cmd);
  this.socket.write(cmd + "\n");
};




module.exports = SocketClient;
