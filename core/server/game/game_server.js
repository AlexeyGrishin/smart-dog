var ReplayDataStorer = require('../storage/replay_data_storer.js');

var GameServer = function(storage, maps, gameFactory, options) {
  this.storage = storage;
  this.waiting = [];
  this.nextGameId = 1;
  this.maps = maps;
  this.options = options;
  this.gameFactory = gameFactory;
};

var IoInterface = {
  sendWait: function(players) {},
  setPlayerInterface: function(playerInterface) {},
  //next methods depend on player
  init: function(playerInterface) {},
  sendTurn: function() {},
  finished: function(winner, result) {}
};

GameServer.prototype = {


  connect: function(playerId, playerName, ioInterface) {
    var playerInfo = {
      id: playerId,
      name: playerName,
      io: ioInterface
    };
    this.waiting.push(playerInfo);
    if (this.waiting.length == this.maps.maxPlayersCount()) {
      this.startGame();
    }
    else {
      if (this.waiting.length >= this.maps.minPlayersCount()) {
        this.waitForAnotherPlayer = setTimeout(function() {
          this.startGame();
        }.bind(this), this.options.waitForPlayer);
      }
      playerInfo.io.sendWait(this.waiting.length);
    }
  },

  startGame: function() {
    //guard
    if (this.waiting.length < this.maps.minPlayersCount()) return;
    clearTimeout(this.waitForAnotherPlayer);
    var players = this.waiting.splice(0, this.waiting.length);
    var game = this.gameFactory.createGame();
    var id = this.nextGameId++;
    game.setId(id);
    game.setPlayers(players);
    this.maps.initGameMap(game, game.getPlayers());
    this.storage.saveGame(id, game);
    game.start();
    var replay = new ReplayDataStorer(game);
    game.on('game.stop', function(results) {
      this.storage.saveReplay(game, replay.getReplay());
    }.bind(this));

  },

  listen: function(id, callback) {
    var callbacks = {
    };
    this.storage.getGameInfo(id, function(error, game) {
      if (error) return callback("There is no game with given id");

      callbacks.onTurn = function() {
        callback(undefined, game.getId(), game.toState());
      };
      callbacks.onStop = function() {
        callback('game.stop', game.getId(), game.toState())
      };
      if (!game.isFinished()) {
        game.on('game.turn', callbacks.onTurn);
        game.on('game.stop', callbacks.onStop);
        callbacks.onTurn();
      }
      else {
        callbacks.onStop();
      }
    });
    return callbacks;
  },

  unlisten: function(id, callbacks) {
    if (!callbacks || !callbacks.onTurn) return;
    this.storage.getGameInfo(id, function(error, game) {
      if (game) {
        game.removeListener('game.turn', callbacks.onTurn);
        game.removeListener('game.stop', callbacks.onStop);
      }
    });
  },

  listGames: function(onlyActive, cb) {
    this.storage[onlyActive ? 'listActiveGames' : 'listGames'](function(error, games) {
      if (error) return cb(error);
      cb(null, games.map(function(g) {
        return {
          id: g.getId(),
          players: g.getPlayers().map(function(p) {return p.name}),
          brief: g.getBriefStatus(),
          finished:g.isFinished()
        }
      }))
    });
  },

  getGame: function(id, cb) {
    this.storage.getGameInfo(id, cb);
  },

  getGameReplay: function(id, cb) {
    this.storage.getReplay(id, cb);
  },

  getGameReplayFile: function(id, cb) {
    this.storage.getGameReplayFile(id, cb);
  }


};


module.exports = GameServer;