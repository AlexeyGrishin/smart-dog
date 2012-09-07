var SocketJson = require('./socket_json.js');


var SocketController = function(socket, gameServer) {
  this.socket = socket;
  this.gameServer = gameServer;

  socket.on('message', this.receive.bind(this));
  socket.on('disconnect', this.disconnect.bind(this));
};

SocketController.prototype = {
  receive: function(cmd) {
    try {
      SocketJson.receive.call(this, cmd);
    }
    catch (e){
      this.returnErrorIfAny(e);
      throw e;
    }
  },

  /* protocol commands */
  join: function(name) {
    this.gameServer.connect(this.socket.id.toString(), name, this);
  },

  turn: function(commands) {
    for (var i = 0; i < commands.length; i++) {
      var action = commands[i].action;
      var parts = action.split(" ");
      var cmd = parts.splice(0, 1)[0].trim();
      var args = parts.slice();
      args.unshift(commands[i].id);
      this.player.command(cmd, args, this.sendWarning.bind(this));
    }
    this.player.endTurn();
  },

  sendWarning: function(warning) {
    if (warning) {
      this.send("warning", warning);
    }
  },

  send: function(cmd, arg) {
    this.socket.send(cmd + (arg ? " " + arg : ""));
  },

  sendWait: function(players) {
    this.send("wait", players);
  },

  sendTurn: function(turn) {
    var state = this.player.toState();
    state.landscape = undefined;
    this.send("turn ", JSON.stringify(state));
  },

  setPlayerInterface: function(player) {
    this.player = player;
    player.setController(this);
    this.returnErrorIfAny();
  },

  init: function(player) {
    var state = this.player.toState();
    var initState = {
      you: player.getId(),
      landscape: state.landscape
    };
    this.send("start", JSON.stringify(initState));
  },

  returnErrorIfAny: function(error) {
    if (!error) error = this.error;
    if (error) {
      if (this.player)
        this.player.endTurn(error);
      else
        this.error = error;
    }
  },

  finished: function(myWin, state) {
    this.send("finished", JSON.stringify({
      youWin: myWin,
      winner: state.winner.name,
      stopReason: state.stopReason
    }));
    this.stopped = true;
    this.socket.disconnect();
  },

  disconnect: function() {
    if (this.stopped) return;
    this.stopped = true;
    this.returnErrorIfAny('player.gone');
  }

};

module.exports = SocketController;