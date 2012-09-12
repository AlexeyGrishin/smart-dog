var GameObject = require("./game_object.js")
  , events = require("events")
  , util = require("util");


var Game = function(logic, playerFactory, options) {
  this.o = options;
  this.logic = logic;
  this.playerFactory = playerFactory;
  this.on(GameObject.Event.Move, function(object, oldX, oldY) {
    this.map.objectMoved(object, oldX, oldY);
  });
  this.players = [];
  this.setMaxListeners(9999);
};

Game.Event = {
  Turn: 'game.turn',
  BeforeTurn: 'game.beforeTurn',
  AfterTurn: 'game.afterTurn',
  Stop: 'game.stop',
  PlayerGone: 'player.gone',
  PlayerTurn: 'player.turn',
  PlayerMissedTurn: 'player.missed'
};

Game.prototype.__proto__ = events.EventEmitter.prototype;


var GameMethods = {
  start: function() {
    this.turn = 0;
    //TODO: send events instead of 'logic' calls
    //TODO: order is important. logic.init initializes cached landscape, getState puts it into savedState, and player.init uses it
    this.logic.init(this);
    this.savedState = this.genState();
    this.brief = this.genBrief();
    this.players.forEach(function(p) {p.init();});
    this.on(Game.Event.PlayerTurn, this.catchError(this.onPlayerTurn.bind(this)));
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
      this.endTurn(true, error || Game.Event.PlayerMissedTurn, p);
    }
  },

  doTurn: function() {
    this.turnMade = 0;
    //TODO: probably we need more events, the valid sequence shall be the following:
    //1. generate player state (now is BeforeTurn)
    // 1.2 - reset state of game-object? i.e. clear 'barking' flag, etc. - before the next move
    // 1.3 send to players (now in makeTurn)
    //2. receive turns (change GameObjects state)
    //3. do internal logic (change GameObjects state)
    //4. generate game-object states
    //5. calculate score, generate player state?
    //6. generate game state
    //7. render
    this.emit(Game.Event.BeforeTurn, this.savedState);
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
      this.endTurn(true, Game.Event.PlayerGone, player);
    }.bind(this)
    ), this.o.waitForTurn);
  },

  endTurn: function(stop, stopReason, playerCausedStop) {
    clearTimeout(this.turnTimeout);
    this.logic.afterTurn(this.turn);
    this.emit(Game.Event.AfterTurn);
    this.turn++;
    this.savedState = this.genState();
    this.brief = this.genBrief();
    this.emit(Game.Event.Turn, this.savedState);
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
      this.savedState = this.genState();
      this.emit(Game.Event.Stop, gameResult);
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

  getMapName: function() {
    return this.mapName;
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
      brief.winner = this.gameResult.winner ? {id: this.gameResult.winner.id, name: this.gameResult.winner.name} : undefined;
      brief.reason = this.gameResult.reason;
    }
    return this.logic.getBriefStatus(brief);
  },

  genState: function() {
    var state = this.genBrief();
    state.players = this.players.map(function(p) {return {id:p.getId(), name:p.getName(), score:p.calculateScore()}});
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