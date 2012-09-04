/**
 * Protocol description
 * --> join <username>    # first command, want to join the game
 * <-- wait 1             # please wait, there is only 1 player, wait more
 * <-- start              # game is started
 * <-- turn <state>    # please make turn
 *  <state> = json
 *  {
 *    turn: <turnNr>,
 *    dogs: [{type: "Dog", x:<x>, y:<y>, barking:<tf>, id:<id>}, ..],
 *    visibleArea: [{type: "Grass|Tree|Wall|Sheep|Site|Dog", x:<x>, y:<y>, owner:<owner>}, ..]
 *  }
 *  -->turn [<command>,<command>]
 *    where <command> = {cmd: <name>, args: <args>}
 *  <-- warning <warning>     #if turn was generated some errors
 * <-- finished <state>
 *    where <state> = {youWin: <tf>, winner: <name>, stopReason: <reason>}
 *
 */

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

  join: function(name) {
    this.gameServer.connect(this.socket.id.toString(), name, this);
  },

  turn: function(commands) {
    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i].cmd;
      var args = commands[i].args;
      this.player.command(cmd, args, this.warning.bind(this));
    }
    this.player.endTurn();
  },

  warning: function(warning) {
    if (warning) {
      this.send("warn", warning);
    }
  },

  send: function(cmd, arg) {
    this.socket.send(cmd + (arg ? " " + arg : ""));
  },

  wait: function(players) {
    this.send("wait", players);
  },

  makeTurn: function() {
    var state = this.player.toState();
    this.send("turn", JSON.stringify(state));
  },

  setPlayerInterface: function(player) {
    this.player = player;
    player.setController(this);
    this.returnErrorIfAny();
  },

  init: function(player) {
    this.send("start");
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