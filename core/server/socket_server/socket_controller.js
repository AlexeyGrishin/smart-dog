var SocketJson = require('./socket_json.js')
  , readline = require('readline')
  , _ = require('cloneextend');


/**
 * Controller for smart dog player interface which works via sockets.
 * WARNING: this class uses 'plain' sockets, not the socket.io sockets. The client shall work with plain sockets, not the WebSockets
 * @param socket plain socket
 * @param gameServer game server
 * @constructor
 */
var SocketController = function(socket, gameServer) {
  this.socket = socket;
  this.rl = readline.createInterface({
    input: socket,
    output: socket
  });
  this.gameServer = gameServer;

  this.rl.on('line', this.receive.bind(this));
  this.socket.on('close', this.disconnect.bind(this));
  this.socket.on('error', this.disconnect.bind(this));
};

SocketController.prototype = {
  receive: function(cmd) {
    try {
      SocketJson.receive.call(this, cmd.toString());
    }
    catch (e){
      this.returnErrorIfAny(e);
      throw e;
    }
  },

  /* protocol commands */
  "join": function(name, hub) {
    this.gameServer.connect(name, this, hub);
  },

  unknown: function(cmd, arg) {
    console.error("Unknown command: " + cmd + "(" + arg + ")");
  },

  "do": function(action) {
    var parts = action.split(" ");
    var id = parts[0];
    var cmd = parts[1];
    var args = parts.slice(2);
    args.unshift(id);
    this.player.command(cmd, args, this.sendWarning.bind(this));
  },

  "end": function() {
    this.player.endTurn();
  },

  sendWarning: function(warning) {
    if (warning) {
      this.send("warning", warning);
    }
  },

  send: function(cmd, arg) {
    SocketJson.send.call(this, cmd, arg);
    //this.socket.send(cmd + (arg ? " " + arg : ""));
  },

  sendWait: function(players) {
    this.send("wait", players);
  },

  sendTurn: function(turn) {
    var state = this.player.toState();
    state.landscape = undefined;
    this.send("state ", {turn: state.turn});
    for (var i = 0; i < state.objects.length; i++) {
      this.send("obj ", state.objects[i]);
    }
    this.send("turn");
  },

  setPlayerInterface: function(player) {
    this.player = player;
    player.setController(this);
    this.returnErrorIfAny();
  },

  init: function(player) {
    var state = player.toState();
    var landscape = state.landscape;
    var initState = _.extend({
      you: state.playerId,
      rows: landscape.length,
      cols: landscape[0].length,
      players: state.playersCount

    }, player.getGameOptions());
    this.send("start", initState);
    this.send("landscape", landscape);
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
    this.stopped = true;
    this.send("finished", {
      youWin: myWin,
      winner: state.winner ? state.winner.id : undefined,
      stopReason: state.stopReason
    });
    this.socket.end();
  },

  disconnect: function() {
    console.log("Disconnected " + (this.player ? this.player.getId() : "<unknown>"));
    if (this.stopped) return;
    this.stopped = true;
    this.returnErrorIfAny('player.gone');
  }

};

module.exports = SocketController;