/**
 * protocol
 *
 * <-- list [{id: <id>, map: <map>, players: [<name1>,...], finished: <tf>, stopReason: <reason>}, ..]
 * --> listen <gameId>
 *  -- each update --
 * <-- view <gameId> {landscape: ["...", "..."], players: [{name, score}, {name, score}], dogs: [{x, y, owner, moveFromX, moveFromY},...], sheeps: []};
 * <-- end <gameId> {...last map state..., winner: , stopReason}
 * <-- error <gameId> {error}
 */

var SocketJson = require('./socket_json.js');

function SocketView(socket, gameServer) {
  this.socket = socket;
  this.gameServer = gameServer;
  socket.on('message', this.receive.bind(this));
  socket.on('disconnect', this.disconnect.bind(this));
  this.sendList(true);
  this.ids = [];
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
    this.send("list", JSON.stringify(this.gameServer.listGames(active)));
  },

  sendUpdate: function(error, id, state) {
    if (error) {
      if (error == "game.stop") {
        this.sendFinished(id, state);
      }
      else {
        this.sendError(id, error);
      }
    }
    else {
      this.send("view " + id, JSON.stringify(state));
    }

  },

  sendError: function(id, state) {
    this.send("error " + id, JSON.stringify({error: typeof state == 'object' ? state.reason : state}))
  },

  sendFinished: function(id, state) {
    this.send("end " + id, JSON.stringify(state));
  }
};

module.exports = SocketView;
