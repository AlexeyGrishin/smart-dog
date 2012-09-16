var GameObject = require("./game_object.js")
  , events = require("events")
  , util = require("util");

/**
 * Represents single game session. Holds anything related - players, map, etc.
 * Also controls the game events - when to start turn, when to finish, etc.
 *
 * Currently implements turn-based game.
 *
 * Also all game events go though this object. Other obejcts (like game objects) shall subscribe on events for game
 * and shall trigger events for the game.
 *
 * All game-specific logic shall be encapsulated in subclasses, players and specific game objects.
 *
 * @param options
 * @constructor
 */
var Game = function(options) {
  events.EventEmitter.call(this);
  this._ = {};
  this._.o = options;
  this.on(GameObject.Event.Move, function(object, oldX, oldY) {
    this._.map.objectMoved(object, oldX, oldY);
  }.bind(this));
  this._.players = [];
  this.setMaxListeners(9999);
};

Game.Event = {
  Init: 'game.init',
  Turn: 'game.turn',
  BeforeTurn: 'game.beforeTurn',
  AfterTurn: 'game.afterTurn',
  Stop: 'game.stop',
  PlayerGone: 'player.gone',
  PlayerTurn: 'player.turn',
  PlayerMissedTurn: 'player.missed'
};

util.inherits(Game, events.EventEmitter);


var GameMethods = {
  start: function() {
    var _ = this._;
    _.turn = 0;
    //TODO: order is important. logic.init initializes cached landscape, getState puts it into savedState, and player.init uses it
    this.emit(Game.Event.Init);
    _.savedState = this._genState();
    _.brief = this._genBrief();
    _.players.forEach(function(p) {p.init();});
    this.on(Game.Event.PlayerTurn, this._catchError(this._onPlayerTurn.bind(this)));
    setTimeout(this._catchError(this._doTurn.bind(this)), 0);
  },

  _catchError: function(f) {
    return function() {
      try {
        f.apply(this, arguments);
      }
      catch (e) {
        console.trace();
        console.error("Unexpected error: " + e);
        console.error(e.stack);
        this._stopGame("Unexpected error: " + e);
        try {
          this._checkGameFinished();
        }
        catch (e) {
          console.error("Cannot execute checkGameFinished " - e);
          console.error(e.stack);

        }
      }
    }.bind(this);
  },

  _onPlayerTurn: function(p, turnMade, error) {
    if (!error && turnMade == this._.turn) {
      this._.turnMade++;
      if (this._.turnMade == this._.players.length) {
        this._endTurn();
      }
    }
    else {
      this._endTurn(true, error || Game.Event.PlayerMissedTurn, p);
    }
  },

  _doTurn: function() {
    var _ = this._;
    _.turnMade = 0;
    this.emit(Game.Event.BeforeTurn, _.savedState);
    _.players.forEach(function(p) {
      p.makeTurn(_.turn);
    }.bind(this));
    this._.turnTimeout = setTimeout(this._catchError(function() {
      var player = undefined;
      for (var i = 0; i < _.players.length; i++) {
        if (!_.players[i].isMoved()) {
          player = _.players[i];
          break;
        }
      }
      this._endTurn(true, Game.Event.PlayerGone, player);
    }.bind(this)
    ), _.o.waitForTurn);
  },

  _endTurn: function(stop, stopReason, playerCausedStop) {
    var _ = this._;
    clearTimeout(this._.turnTimeout);
    this.emit(Game.Event.AfterTurn);
    _.turn++;
    _.savedState = this._genState();
    _.brief = this._genBrief();
    this.emit(Game.Event.Turn, _.savedState);
    if (!stop) setTimeout(this._catchError(this._doTurn.bind(this)), 0);
    if (this._getGameResult().finished || stop) {
      this._stopGame(stopReason, playerCausedStop);
    }
    this._checkGameFinished();

  },

  _checkGameFinished: function() {
    var _ = this._;
    var gameResult = this._getGameResult();
    if (gameResult.finished) {
      _.gameResult = gameResult;
      _.players.forEach(function(p) {
        p.finished(gameResult);
      });
      _.brief = this._genBrief();
      _.savedState = this._genState();
      this.emit(Game.Event.Stop, gameResult);
    }
  },

  isFinished: function() {
    return this._.gameResult !== undefined;
  },

  getGameResult: function() {
    return this._.gameResult;
  },

  setPlayers: function(players) {
    this._.players = players.slice();
    /* TODO: delete
    var index = 1;
    players.forEach(function(p) {
      var pi = this._.playerFactory.createPlayer(this, {name:p.name}, index++);
      p.pi = pi;
      p.io.setPlayerInterface(pi);
      this._.players.push(pi);
    }.bind(this))*/

  },

  setMap: function(name, map) {
    this._.map = map;
    this._.mapName = name;
  },

  getMap: function() {
    return this._.map;
  },

  getMapName: function() {
    return this._.mapName;
  },

  setId: function(id) {
    this._.id = id;
  },

  getId: function() {
    return this._.id
  },

  getPlayers: function() {
    return this._.players;
  },

  getBriefStatus: function() {
    return this._.brief;
  },

  _genBrief: function() {
    var brief = {map: this._.mapName, width: this._.map.cols, height: this._.map.rows, turn: this._.turn};
    brief.players = this._.players.map(function(p) {return {id:p.getId(), name:p.getName(), score:p.calculateScore()}});
    if (this.isFinished()) {
      brief.finished = true;
      brief.winner = this._.gameResult.winner ? {id: this._.gameResult.winner.id, name: this._.gameResult.winner.name} : undefined;
      brief.reason = this._.gameResult.reason;
    }
    return brief;
  },

  _genState: function() {
    var state = this._genBrief();
    //TODO: optimize - cache landscape
    state.objects = this._.map.allObjects.map(function(o) {
      return o.toState();
    });
    return state;
  },

  toState: function() {
    return this._.savedState;
  },

  getTurn: function() {
    return this._.turn;
  },

  //protected
  _stopGame: function(stopReason, playerCausedStop) {

  },

  //protected
  _getGameResult: function() {
    return {finished: false};
  }



};

Object.keys(GameMethods).forEach(function(m) {
  Game.prototype[m] = GameMethods[m];
});


module.exports = Game;