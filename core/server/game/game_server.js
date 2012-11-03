var ReplayDataStorer = require('../storage/replay_data_storer.js')
  //assertvanish may be installed/running under Linux only
  , assertvanish = function(){};//require('assertvanish');


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
  this.maps = maps;
  this.options = options;
  this.gameFactory = gameFactory;
  this.waitForAnotherPlayer = {};
};

var IoInterface = {
  sendWait: function(players) {},
  setPlayerInterface: function(playerInterface) {},
  //next methods depend on player
  init: function(playerInterface) {},
  sendTurn: function() {},
  sendError: function(error) {},
  finished: function(winner, result) {}
};


GameServer.prototype = {

  /**
   * Initializes game server and storage. Shall be called first, and other methods shall be called only after initialization is done
   * @param cb
   */
  init: function(cb) {
    this.storage.initAndGetNextId(function(err, id) {
      if (err) return cb(err);
      console.log("Start numerating games from " + id);
      this.nextGameId = id;
      this.storage.registerHubs(this.maps.getHubs());
      cb(null)
    }.bind(this));

  },

  /**
   * Adds player to the waiting list. The game will be started as soon as possible - usually waits for other players.
   *
   * @param playerName
   * @param ioInterface
   */
  connect: function(playerName, ioInterface, hub) {
    var playerInfo = {
      name: playerName,
      io: ioInterface,
      hub: hub
    };
    this.waiting.push(playerInfo);
    var gameToStart = this.maps.getGameToStart(this.waiting, playerInfo);
    if (gameToStart.exists && !gameToStart.waitMore) {
      this._startGame(gameToStart);
    }
    else {
      if (gameToStart.exists) {
        clearTimeout(this.waitForAnotherPlayer[gameToStart.hub]);
        this.waitForAnotherPlayer[gameToStart.hub] = setTimeout(function doStart() {
          this._startGame(gameToStart);
        }.bind(this), this.options.waitForPlayer);
      }
      if (!gameToStart.error) {
        playerInfo.io.sendWait(this.waiting.length);
      }
      else {
        playerInfo.io.sendError(gameToStart.error);
      }
    }
    assertvanish(ioInterface, 60000);
    ioInterface = null;
  },

  _startGame: function(gameToStart) {
    //guard
    //if (this.waiting.length < this.maps.minPlayersCount()) return;
    clearTimeout(this.waitForAnotherPlayer[gameToStart.hub]);
    gameToStart.players.forEach(function(p) {
      this.waiting.splice(this.waiting.indexOf(p), 1);
    }.bind(this));
    var id = this.nextGameId++;
    var game = this.gameFactory.createGame(id, gameToStart);
    this.maps.gameStarted(gameToStart);
    this.storage.saveGame(id, game);
    game.start();
    var replay = new ReplayDataStorer(game);
    game.on('game.stop', function onGameStop(results) {
      console.log("Objects: " + require('./game_object.js').id())
      this.storage.saveGame(game.getId(), game);
      this.storage.saveReplay(game, replay.getReplay());
      replay = null;
      assertvanish(game._.map, 10000);
      assertvanish(game._.$, 10000);
      game = null;
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
   * @deprecated use listGames2 instead. Remove this method after refactoring socket_view
   */
  listGames: function(onlyActive, hub, cb) {
    this.storage[onlyActive ? 'listActiveGames' : 'listGames'](hub, function(error, games) {
      if (error) return cb(error);
      cb(null, games.map(function(g) {
        return {
          id: g.getId(),
          brief: g.getBriefStatus(),
          finished:g.isFinished()
        }
      }))
    });
  },

  /**
   * Gets all games for specified hub. One page is returned assuming that there is <c>perPage</c> games on single page
   * @param hub
   * @param page
   * @param perPage
   * @param cb
   */
  listGames2: function(hub, page, perPage, cb) {
    this.storage.listGames(hub, {page:page, perPage:perPage, originalSort: function(game1, game2) {
      if (!game1.finished && game2.finished) return -1;
      if (game1.finished && !game2.finished) return 1;
      return game2.id - game1.id;
    }}, cb);
  },

  /**
   *
   * Additional functionaity for development/testing purposes only!
   * @param cb
   */
  doIfSupports: function(functionality, cb) {
    if (!this.supports(functionality)) {
      return cb("Not supported")
    }
    switch (functionality) {
      case 'reset': {
        if (this.storage.reset)
          this.storage.reset(function(err) {
            if (err) return cb(err);
            this.init(cb);
          }.bind(this));
        else cb(null);
      }
    }
  },

  /**
   * Checks that functionaity with specified name is supported or not
   * @param functionality
   * @return {*}
   */
  supports: function(functionality) {
    switch (functionality) {
      case 'reset': return !!this.options.developer;
      default: return false;
    }
  },

  /**
   * Calls cb with array of players info {
   *  name: <name>,
   *  score: <score for specified hub>
   * }
   * @param hub
   * @param cb
   */
  listPlayers: function(hub, cb) {
    this.storage.listPlayers(hub, cb);
  },

  listHubs: function(cb) {
    this.storage.listHubs(cb);
  },

  getGame: function(id, cb) {
    this.storage.getGameInfo(id, cb);
  },

  getPlayerInfo: function(id, cb) {
    this.storage.getPlayerInfo(id, cb);
  },

  getGameReplay: function(id, cb) {
    this.storage.getReplay(id, cb);
  },

  getGameReplayFile: function(id, cb) {
    this.storage.getGameReplayFile(id, cb);
  }


};


module.exports = GameServer;