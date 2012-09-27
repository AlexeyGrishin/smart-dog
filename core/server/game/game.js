var GameObject = require("./game_object.js")
  , events = require("events")
  , util = require("util")
  , _ = require('cloneextend')
  , helper = require('./helper.js')
  , Moveable = require('./moveable.js');

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
  this._.hub = null;
  this.on(GameObject.Event.Move, function(object, oldX, oldY) {
    this._.map.objectMoved(object, oldX, oldY);
  }.bind(this));
  this._.players = [];
  this.setMaxListeners(9999);
  this.__defineGetter__('$', function() {return this._.$});
};

Game.Event = {
  Init: 'game.init',    //nothing is initialized
  Start: 'game.start',  //everything is initialized, ready for first
  //Game cycle:
  BeforeTurn: 'game.beforeTurn',
  PlayersReady: 'game.playerReady',  //sent when player may make the turn
  AfterTurn: 'game.afterTurn',
  Turn: 'game.turn',
  //
  Stop: 'game.stop',
  PlayerGone: 'player.gone',
  PlayerTurn: 'player.turn',
  PlayerMissedTurn: 'player.missed'
};

util.inherits(Game, events.EventEmitter);


var GameMethods = {
  start: function() {
    var _ = this._;
    _.turn = -1;//before game start
    //TODO: order is important. logic.init initializes cached landscape, getState puts it into savedState, and player.init uses it
    this.emit(Game.Event.Init);
    _.savedState = this._genState();
    _.brief = this._genBrief();
    _.players.forEach(function(p) {p.init();});
    this._measure();
    this.on(Game.Event.PlayerTurn, this._catchError(this._onPlayerTurn.bind(this)));
    setTimeout(this._catchError(this._doTurn.bind(this)), 0);
    this.emit(Game.Event.Start);
  },

  _measure: function(topic) {
    var now = new Date();
    if (this._.lastDate) {
      var dur = now - this._.lastDate;
      //console.log("         " + topic + " took " + dur + "ms");
    }
    this._.lastDate = new Date();
  },

  _catchError: function(f) {
    return function() {
      try {
        f.apply(this, arguments);
      }
      catch (e) {
        throw e;
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
    this._measure(" - before doTurn");
    if (this.isFinished()) return;
    var _ = this._;
    _.turn++;
    _.turnMade = 0;
    this.emit(Game.Event.BeforeTurn);
    this._measure("BeforeTurn");
    _.players.forEach(function(p) {
      p.makeTurn(_.turn);
    }.bind(this));
    if (_.o.waitForTurn > 0) {
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
    }
    this.emit(Game.Event.PlayersReady);
  },

  _endTurn: function(stop, stopReason, playerCausedStop) {
    this._measure("turn made by players");
    var _ = this._;
    clearTimeout(this._.turnTimeout);
    this.emit(Game.Event.AfterTurn);
    this._measure("AfterTurn");
    _.savedState = this._genState();
    _.brief = this._genBrief();
    this.emit(Game.Event.Turn, _.savedState);
    this._measure("Turn");
    if (this._getGameResult().finished || stop) {
      this._stopGame(stopReason, playerCausedStop);
    }
    this._checkGameFinished();
    this._measure("stopGame/checkFinished");
    if (!stop && !this.isFinished()) {
      setTimeout(this._catchError(this._doTurn.bind(this)), 0);
    }

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
      clearTimeout(_.turnTimeout);
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

  },

  setMap: function(name, map) {
    this._.map = map;
    this._.mapName = name;
    this._.$ = helper(map);
    this._addModules(this._.$);
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

  setHub: function(hub) {
    this._.hub = hub;
  },

  getHub: function() {
    return this._.hub
  },

  getPlayers: function() {
    return this._.players;
  },

  getBriefStatus: function() {
    return this._.brief;
  },

  _genBrief: function() {
    var brief = _.extend({map: this._.mapName, width: this._.map.cols, height: this._.map.rows, turn: this._.turn}, this._.o);
    brief.players = this._.players.map(function(p) {return {id:p.getId(), name:p.getName(), score:p.calculateScore(), area:p.getArea()}});
    if (this.isFinished()) {
      brief.finished = true;
      brief.winner = this._.gameResult.winner ? {id: this._.gameResult.winner.id, name: this._.gameResult.winner.name} : undefined;
      brief.reason = this._.gameResult.reason;
    }
    if (this._.hub) {
      brief.hub = this._.hub;
    }
    return brief;
  },

  _genState: function() {
    var state = this._genBrief();
    state.objects = this._.map.getObjectsBy("object").map(function(o) {
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

  stop: function(reason) {
    this._stopGame(reason);
    this._checkGameFinished();
  },

  //protected
  _stopGame: function(stopReason, playerCausedStop) {

  },

  //protected
  _getGameResult: function() {
    return {finished: false};
  },

  _addModules: function($) {
    //by default
    $.moveable = $.extend($, Moveable);
  }



};

Object.keys(GameMethods).forEach(function(m) {
  Game.prototype[m] = GameMethods[m];
});


module.exports = Game;