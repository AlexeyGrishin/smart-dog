var GameServer = require('../../core/server/game/game_server.js')
  , Factory = require('../../games/smart-dog/server/game_object_factory.js')()
  , Map2D = require('../../core/server/game/map2d.js')
  , SocketController = require('../../core/server/socket_server/socket_controller.js')
  , MemoryStorage = require('../../core/server/storage/games_storage.js');

var MapsMock = {
  minPlayersCount: function() { return 1},
  maxPlayersCount: function() {return 1},
  initGameMap: function(game, players) {
    var map2d = new Map2D();
    var map = Factory.parseMapPart(["@..", "...", "..."]);
    game.setMap("", map2d);
    Factory.fillMap(map, players, map2d, game);
  },
  getGameToStart: function(players) {
    return {
      exists: true,
      map: new Map2D(),
      mapName: "test",
      mapCtor: Factory.parseMapPart(["@..", "...", "..."]),
      players: players.slice(),
      waitMore: false
    }
  },
  gameStarted: function(g) {

  },
  getHubs: function() {return []}
};

var MockIo = function() {
  this.sendWait = function() {
    this.waitCalled = true;
  };
  this.setPlayerInterface = function(pi) {
    this.pi = pi;
    this.playerInterfaceCalled = true;
  };

};

var MockSocket = function() {
  this.id = 1;
  this.on = function() {};
  var sent = [];
  this.write = function(data) {
    if (data == '\n') return;
    sent.push(data);
  };
  this.sent = function() {
    return sent;
  };
  this.resume = function() {

  };

  this.next = function() {
    return sent.shift();
  };
  this.hasNext = function() {
    return sent.length > 0;
  };
  this.disconnected = false;
  this.disconnect = function() {
    this.disconnected = true;
  };
  this.end = function() {

  }
  this.destroy = function() {}
};

module.exports = {
  setUp: function(cb) {
    this.server = new GameServer(new MemoryStorage(), MapsMock, Factory, {waitForPlayer: 0});
    this.mockSocket1 = new MockSocket();
    this.playerSocket1 = new SocketController(this.mockSocket1, this.server);
    cb();
  }

  ,testMainSuccess: function(test) {
    this.playerSocket1.receive('join Alex');
    setTimeout(function() {
      test.ok(this.mockSocket1.hasNext());
      test.ok(this.mockSocket1.next().indexOf('start') == 0);
      test.ok(this.mockSocket1.next().indexOf('landscape') == 0);
      test.ok(this.mockSocket1.next().indexOf('state') == 0);
      var obj = this.mockSocket1.next();
      test.ok(obj.indexOf('obj') == 0);
      var turn = this.mockSocket1.next();
      console.log(turn);
      test.ok(turn.indexOf('turn') == 0);
      var state = JSON.parse("{" + obj.substring(4) + "}");
      test.deepEqual(state,
        {
          id: this.playerSocket1.player.dogs[0].id,
          x: 0,
          y: 0,
          owner: 1,
          type: "Dog",
          action: "move"
        });
      test.equals(this.mockSocket1.disconnected, false);
      this.playerSocket1.receive('do 1 move up\n');
      this.playerSocket1.receive('end\n');
      this.playerSocket1.disconnect();

      test.done();
    }.bind(this), 1);
  }
};

//module.exports.setUp(function() {});
//module.exports.testMainSuccess({ok:function() {},equals: function() {}, done: function() {}, deepEqual: function() {}});