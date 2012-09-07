var GameServer = require('../core/server/game/game_server.js')
  , Factory = require('../games/smart-dog/server/game_object_factory.js')
  , Map2D = require('../core/server/game/map2d.js')
  , SocketController = require('../core/server/socket_server/socket_controller.js')
  , MemoryStorage = require('../core/server/storage/mem_storage.js');

var MapsMock = {
  minPlayersCount: function() { return 1},
  maxPlayersCount: function() {return 1},
  initGameMap: function(game, players) {
    var map2d = new Map2D();
    var map = Factory.parseMapPart(["@..", "...", "..."]);
    game.setMap("", map2d);
    Factory.fillMap(map, players, map2d, game);
  }
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
  this.send = function(data) {
    sent.push(data);
  };
  this.sent = function() {
    return sent;
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
  }
};

module.exports = {
  setUp: function(cb) {
    this.server = new GameServer(new MemoryStorage(), MapsMock, Factory, {waitForPlayer: 0});
    this.mockSocket1 = new MockSocket();
    this.playerSocket1 = new SocketController(this.mockSocket1, this.server);
    cb();
  },

  testMainSuccess: function(test) {
    this.playerSocket1.receive('join Alex');
    setTimeout(function() {
      test.ok(this.mockSocket1.hasNext());
      test.equals(this.mockSocket1.next(), "start");
      var turn = this.mockSocket1.next();
      console.log(turn);
      test.ok(turn.indexOf('turn ') == 0);
      var state = JSON.parse(turn.substring(5));
      test.deepEqual(state.dogs, [
        {
          id: 1,
          x: 0,
          y: 0,
          layer: "object",
          owner: 1,
          type: "Dog",
          barking: false
        }]);
      test.equals(this.mockSocket1.disconnected, false);
      this.playerSocket1.receive('turn [{"id": 1, "action": "move up"}]');
      test.done();
    }.bind(this), 1);
  }
};

//module.exports.setUp(function() {});
//module.exports.testMainSuccess({ok:function() {},equals: function() {}, done: function() {}, deepEqual: function() {}});