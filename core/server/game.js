var GameObject = require("./game_object.js")
  , events = require("events")
  , util = require("util")
  , Dog = require('./dog');

var Game = function(logic, playerFactory, options) {
  this.o = options;
  this.logic = logic;
  this.playerFactory = playerFactory;
  this.on("gameobject.move", function(object, oldX, oldY) {
    this.map.objectMoved(object, oldX, oldY);
  });
  this.players = [];
};

Game.prototype.__proto__ = events.EventEmitter.prototype;


var GameMethods = {
  start: function() {
    this.turn = 0;
    this.savedState = this.genState();
    this.brief = this.genBrief();
    this.logic.init(this);
    this.players.forEach(function(p) {p.init();});
    this.on('player.turn', this.catchError(this.onPlayerTurn.bind(this)));
    setTimeout(this.catchError(this.doTurn.bind(this)), 0);
  },

  catchError: function(f) {
    return function() {
      try {
        f.apply(this, arguments);
      }
      catch (e) {
        console.trace();
        console.error("Unexpected error: " + e);
        console.error(e.stack);
        this.logic.stopGame("Unexpected error: " + e);
        try {
          this.checkGameFinished();
        }
        catch (e) {
          console.error("Cannot execute checkGameFinished " - e);
          console.error(e.stack);

        }
      }
    }.bind(this);
  },

  onPlayerTurn: function(p, turnMade, error) {
    if (!error && turnMade == this.turn) {
      this.turnMade++;
      if (this.turnMade == this.players.length) {
        this.endTurn();
      }
    }
    else {
      this.endTurn(true, error || "player.missed", p);
    }
  },

  doTurn: function() {
    this.turnMade = 0;
    this.logic.beforeTurn(this.turn);
    this.players.forEach(function(p) {
      p.makeTurn(this.turn);
    }.bind(this));
    this.turnTimeout = setTimeout(this.catchError(function() {
      var player = undefined;
      for (var i = 0; i < this.players.length; i++) {
        if (!this.players[i].moved) {
          player = this.players[i];
          break;
        }
      }
      this.endTurn(true, 'player.gone', player);
    }.bind(this)
    ), this.o.waitForTurn);
  },

  endTurn: function(stop, stopReason, playerCausedStop) {
    clearTimeout(this.turnTimeout);
    this.logic.afterTurn(this.turn);
    this.turn++;
    this.savedState = this.genState();
    this.brief = this.genBrief();
    this.emit("game.turn", this.savedState);
    if (!stop) setTimeout(this.catchError(this.doTurn.bind(this)), 0);
    if (this.logic.getGameResult().finished || stop) {
      this.logic.stopGame(stopReason, playerCausedStop);
    }
    this.checkGameFinished();

  },

  checkGameFinished: function() {
    var gameResult = this.logic.getGameResult();
    if (gameResult.finished) {
      this.gameResult = gameResult;
      this.players.forEach(function(p) {
        p.finished(gameResult);
      });
      this.brief = this.genBrief();
      this.emit('game.stop', gameResult);
    }
  },

  isFinished: function() {
    return this.gameResult !== undefined;
  },

  getGameResult: function() {
    return this.gameResult;
  },

  setPlayers: function(players) {
    this.players = [];
    var index = 1;
    players.forEach(function(p) {
      var pi = this.playerFactory.createPlayer(this, {name:p.name}, index++);
      p.pi = pi;
      p.io.setPlayerInterface(pi);
      this.players.push(pi);
    }.bind(this))
  },

  setMap: function(name, map) {
    this.map = map;
    this.mapName = name;
  },

  getMap: function() {
    return this.map;
  },

  setId: function(id) {
    this.id = id;
  },

  getId: function() {
    return this.id
  },

  getPlayers: function() {
    return this.players;
  },

  getBriefStatus: function() {
    return this.brief;
  },

  genBrief: function() {
    var brief = {map: this.mapName, width: this.map.cols, height: this.map.rows, turn: this.turn};
    if (this.isFinished()) {
      brief.finished = true;
      brief.winner = this.gameResult.winner.name;
      brief.reason = this.gameResult.reason;
    }
    return this.logic.getBriefStatus(brief);
  },

  genState: function() {
    var state = this.genBrief();
    state.players = this.players.map(function(p) {return p.name});
    //TODO: optimize - cache landscape
    state.objects = this.map.allObjects.map(function(o) {
      return o.toState();
    });
    return this.logic.genState(state);
  },

  toState: function() {
    return this.savedState;
  }

};

Object.keys(GameMethods).forEach(function(m) {
  Game.prototype[m] = GameMethods[m];
});


module.exports = Game;