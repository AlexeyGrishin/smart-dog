var ReplayDataStorer = require('../storage/replay_data_storer.js');


/**
 * Represents server which manages games - accepts players, starts games, provides information about them
 * @param storage game storage
 * @param maps available maps collection
 * @param gameFactory factory which produces all game-specific stuff
 * @param options options
 * @constructor
 */
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

  /**
   * Adds player to the waiting list. The game will be started as soon as possible - usually waits for other players.
   *
   * @param playerName
   * @param ioInterface
   */
  connect: function(playerName, ioInterface) {
    var playerInfo = {
      name: playerName,
      io: ioInterface
    };
    this.waiting.push(playerInfo);
    if (this.waiting.length == this.maps.maxPlayersCount()) {
      this._startGame();
    }
    else {
      if (this.waiting.length >= this.maps.minPlayersCount()) {
        this.waitForAnotherPlayer = setTimeout(function() {
          this._startGame();
        }.bind(this), this.options.waitForPlayer);
      }
      playerInfo.io.sendWait(this.waiting.length);
    }
  },

  _startGame: function() {
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

  /**
   * adds listener for the game
   * @param id game id
   * @param callback callback that will be called on each game update. Will be guarantely called at least once even the game is finished
   *  Note: usually first call will contain the whole info and the further calls will contain only 'delta'
   * @return {Object}
   */
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

  /**
   * Removes listener of the game
   * @param id game id
   * @param callbacks an object returned by #listen method
   */
  unlisten: function(id, callbacks) {
    if (!callbacks || !callbacks.onTurn) return;
    this.storage.getGameInfo(id, function(error, game) {
      if (game) {
        game.removeListener('game.turn', callbacks.onTurn);
        game.removeListener('game.stop', callbacks.onStop);
      }
    });
  },

  /**
   * Gets the list of the games asynchronously
   * @param onlyActive
   * @param cb will be called with brief info array (id, players[], brief{}, finished}
   */
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