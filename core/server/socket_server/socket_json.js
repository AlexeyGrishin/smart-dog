function jsonLike(obj) {
  var json = JSON.stringify(obj);
  return json.substr(1, json.length-2);
}

var SocketJson = {
  receive: function(cmd) {
    console.log(cmd);
    try {
      cmd = cmd.replace(/[\n\r]/g, "") + " ";
      var spaceIdx = cmd.indexOf(" ");
      var command = cmd.substring(0, spaceIdx);
      var arg = cmd.substring(spaceIdx+1).trim();
      if (arg.length > 0 && arg.substring(0, 1) == "{" || arg.substring(0, 1) == "[") {
        arg = JSON.parse(arg);
      }
      if (this[command] != undefined)
        this[command](arg);
      else
        this.unknown(command, arg);
    }
    catch (e){
      console.error("Unexpected error in socket receiver: " + e);
      console.error(e.stack);
      throw e;
    }
  },

  send: function(cmd, arg) {
    try {
      if (this.socket.send) //Socket.io
        this.socket.send(cmd + (arg ? " " + jsonLike(arg) : ""));
      else {
        this.socket.write(cmd + (arg ? " " + jsonLike(arg) : ""));
        this.socket.write("\n");
      }
    }
    catch (e) {
      this.disconnect();
    }
    console.log(" < " + cmd + "(" + arg + ")");
  }};

module.exports = SocketJson;
