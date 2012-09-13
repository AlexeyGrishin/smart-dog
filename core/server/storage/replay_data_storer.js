var Game = require('../game/game.js')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ReplayFormat = require('./replay_format.js');

/**
 * Automatically stores the game turns into the file
 * @param game
 * @constructor
 */
var ReplayData = function(game) {
  EventEmitter.call(this);
  this.game = ReplayFormat.getGameInfo(game);
  this.replay = [];
  this.replay.push(ReplayFormat.getFirstState(game.toState()));
  this.game.replay = this.replay;
  game.on(Game.Event.Turn, this.onTurn.bind(this));
  game.on(Game.Event.Stop, this.onStop.bind(this));
};

ReplayData.Event = {
  Turn: 'replay.turn',
  Stop: 'replay.stop'
};

util.inherits(ReplayData, EventEmitter);

ReplayData.prototype.onTurn = function(state) {
  var turn = ReplayFormat.getNextState(state);
  this.replay.push(turn);
  this.emit(ReplayData.Event.Turn, turn);
};

ReplayData.prototype.onStop = function(result) {
  this.game.stopReason = result.reason;
  if (result.winner) {
    this.game.winner = {id: result.winner.getId(), name: result.winner.getName()}
  }
  var turn = {
    winner: this.game.winner,
    stopReason: this.game.stopReason
  };
  this.emit(ReplayData.Event.Stop, turn);
};

ReplayData.prototype.getReplay = function() {
  return this.game;
};

module.exports = ReplayData;
