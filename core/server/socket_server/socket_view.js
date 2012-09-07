var SocketJson = require('./socket_json.js')
  , ReplayFormat = require('../storage/replay_format.js');

function SocketView(socket, gameServer) {
  this.socket = socket;
  this.gameServer = gameServer;
  socket.on('message', this.receive.bind(this));
  socket.on('disconnect', this.disconnect.bind(this));
  this.sendList(true);
  this.ids = [];
  this.first = true;
}

SocketView.prototype = {
  receive: function(cmd) {
    SocketJson.receive.call(this, cmd);
  },

  list: function() {
    this.sendList(false);
  },

  listen: function(id) {
    var cb = this.gameServer.listen(id, this.sendUpdate.bind(this));
    if (cb)
      this.ids.push({id: id, cb: cb});
  },

  disconnect: function() {
    for (var i = 0; i <this.ids; i++) {
      this.gameServer.unlisten(this.ids[i].id, this.ids[i].cb);
    }
  },

  send: function(cmd, arg) {
    this.socket.send(cmd + (arg ? " " + arg : ""));
  } ,

  sendList: function(active) {
    this.gameServer.listGames(active, function(err, games) {
      this.send("list", JSON.stringify(games));
    }.bind(this));
  },

  sendUpdate: function(error, id, state) {
    if (state) var stateToSend = this.first ? ReplayFormat.getFirstState(state) : ReplayFormat.getNextState(state);
    if (error) {
      if (error == "game.stop") {
        this.sendFinished(id, JSON.stringify(stateToSend));
      }
      else {
        this.sendError(id, error);
      }
    }
    else {
      this.send("view " + id, JSON.stringify(stateToSend));
      this.first = false;
    }

  },

  sendError: function(id, state) {
    this.send("error " + id, JSON.stringify({error: typeof state == 'object' ? state.reason : state}))
  },

  sendFinished: function(id, state) {
    this.send("end " + id, state);
  }
};

module.exports = SocketView;
