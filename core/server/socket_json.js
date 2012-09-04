var SocketJson = {
  receive: function(cmd) {
    try {
      cmd = cmd + " ";
      var spaceIdx = cmd.indexOf(" ");
      var command = cmd.substring(0, spaceIdx);
      var arg = cmd.substring(spaceIdx+1).trim();
      if (arg.length > 0 && arg.substring(0, 1) == "{" || arg.substring(0, 1) == "[") {
        arg = JSON.parse(arg);
      }
      if (this[command] != undefined)
        this[command](arg);
    }
    catch (e){
      console.error("Unexpected error in socket receiver: " + e);
      console.error(e.stack);
      throw e;
    }
  }
};

module.exports = SocketJson;
