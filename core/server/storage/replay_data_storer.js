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
  this.replay = [];
  //TODO: ugly, need another way to know that game is not started
  if (game.toState() == undefined) {
    game.once(Game.Event.Start, this.onInit.bind(this, game));
  }
  else {
    this.onInit(game);
  }
  game.on(Game.Event.Turn, this.onTurn.bind(this));
  game.on(Game.Event.Stop, this.onStop.bind(this));
};

ReplayData.Event = {
  Turn: 'replay.turn',
  Stop: 'replay.stop'
};

util.inherits(ReplayData, EventEmitter);

ReplayData.prototype.onInit = function(game) {
  this.game = ReplayFormat.getGameInfo(game);
  this.replay.push(ReplayFormat.getFirstState(game.toState()));
  this.game.replay = this.replay;
};

ReplayData.prototype.onTurn = function(state) {
  var turn = ReplayFormat.getNextState(state);
  this.replay.push(turn);
  this.emit(ReplayData.Event.Turn, turn);
};

ReplayData.prototype.onStop = function(result) {
  this.game.error = result.error;
  if (result.winner) {
    this.game.winner = {id: result.winner.getId(), name: result.winner.getName()}
  }
  var turn = {
    winner: this.game.winner,
    error: this.game.error
  };
  this.emit(ReplayData.Event.Stop, turn);
};

ReplayData.prototype.getReplay = function() {
  return this.game;
};

module.exports = ReplayData;
