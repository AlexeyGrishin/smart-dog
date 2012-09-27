var Map2D = require("../core/server/game/map2d.js")
  , Game = require("../core/server/game/game.js");

function Helper(factory, ioMock) {
  this.factory = factory;
  this.ioMock = ioMock;
}

Helper.prototype = {
  onTurn: function(cb) {
    this.game.once(Game.Event.PlayersReady, cb);
  },

  onFinish: function(cb) {
    this.game.once(Game.Event.Stop, cb);
  },

  skipTurn: function(cb) {
    this.onTurn(function() {
      this.game.getPlayers().forEach(function(p) {p.endTurn()});
      cb(this.game.toState());
    }.bind(this));
  },

  makeTurn: function(turnCb, afterCb) {
    var cbacks = {
      before: turnCb,
      after: afterCb || function() {}
    };
    this.onTurn(function() {
      cbacks.before();
      this.game.getPlayers().forEach(function(p) {p.endTurn()});
      cbacks.after(this.game.toState());
    }.bind(this));
    return {
      after: function(cb) {
        cbacks.after = cb;
      }
    }
  },

  skipTurns: function(count, cb) {
    var i = 0;
    var nextTurn = function() {
      i++;
      if (i == count) return cb(this.game.toState());
      this.skipTurn(nextTurn.bind(this));
    };
    this.skipTurn(nextTurn.bind(this));
  },

  init: function(map, options, playersCount) {
    this.gameFactory = this.factory({games:{default:options}});
    //TODO: game creation seems ugly... =(
    var mapCtor = this.gameFactory.parseMapPart(map);
    playersCount = playersCount || 1;
    var players = [];
    for (var i = 0; i < playersCount; i++) {
      players.push({name: "player" + (i+1), io: this.ioMock});
    }
    this.game = this.gameFactory.createGame(1, {map: new Map2D(), mapCtor: mapCtor, players: players});

    for (var i = 0; i < playersCount; i++) {
      this["player" + (i+1)] = this.game.getPlayers()[i];
      (function(i) {
        this.__defineGetter__("dog" + (i+1), function() {return this.game.getPlayers()[i].dogs[0]});
        this.__defineGetter__("dog" + (i+1) + '_2', function() {return this.game.getPlayers()[i].dogs[1]});
      }.bind(this))(i);
    }
  },

  initAndStart: function(map, options, playersCount) {
    this.init(map, options, playersCount);
    return this.start();
  },

  start: function() {
    this.game.start();
    return this.game.toState();
  },

  doNotExpectGameStop: function(test) {
    this.game.on(Game.Event.Stop, function() {
      if (!this.expectStop) {
        test.fail("Not-expected game stop!");
      }
    }.bind(this));
  },

  stop: function() {
    this.expectStop = true;
    if (this.game) this.game.stop("tearDown");
  },

  mayStop: function() {
    this.expectStop = true;
  },

  charMap: {
    sheep: "*",
    sheep2: "*",
    dog: "@",
    site: "-",
    wall: "#"
  },

  map: function(options) {
    var width = options.w || 10;
    var height = options.h || 10;
    var map = [];
    for (var row = 0; row < height; row++) {
      var r = "";
      for (var col = 0; col < width; col++) {
        var c = ".";
        Object.keys(this.charMap).forEach(function(i) {
          if (options[i] && options[i].x == col && options[i].y == row) {
            c = this.charMap[i];
          }
        }.bind(this));
        r += c;
      }
      map.push(r);
    }
    return map;
  },

  controller: function(player, dog) {
    var helper = this;
    return {
      move: function(direction, cb) {
        helper.makeTurn(function() {
          player.move(dog.id, direction, function(){});
        }).after(cb);
      },

      bark: function(cb) {
        helper.makeTurn(function() {
          player.bark(dog.id, function(){});
        }).after(cb);
      },

      skip: function(count, cb) {
        helper.skipTurns(count, cb);
      },

      waitForEnd: function(cb) {
        helper.onFinish(cb);
        helper.skipTurns(999, cb);
      }
    }
  }


};

function ex(test) {
  return {
    contains: function(obj, props) {
      var oForCompare = {};
      Object.keys(props).forEach(function(k) {
        oForCompare[k] = obj[k];
      });
      test.deepEqual(oForCompare, props);
    },

    noError: function() {
      return function(err) {
        test.ok(err == undefined, "Unexpected error " + err);
      }
    },

    errorStartingWith: function(errorStart) {
      return function(err) {
        test.ok(err !== undefined, "Expected error");
        if (err) test.ok(err.indexOf(errorStart) > -1, "Expected error to be started with '" + errorStart + "', but it does not: " + err);
      }
    }
  }
}



Helper.ex = ex;

module.exports = Helper;