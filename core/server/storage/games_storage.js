var ReplayStorage = require('./mem_storage.js').ReplayStorage
  , MemoryStorage = require('./mem_storage.js').MemoryStorage
  , PlayerInfo = require('./entities.js').PlayerInfo
  , GameInfoFactory = require('./entities.js').GameInfoFactory;

/**
 * Represents storage logic and holds relations between entities.
 * Depends on 2 objects - gamesStorage (cannot find appropriate name :( ) which is used for games/players/hubs info storing and replayStorage which is used for replays.
 * If config is not specified then games/players/hubs will be stored in memory and replays will not be stored at all.
 * @param config
 * @constructor
 */
function GamesStorage(config) {
  if (!config) config = {};
  this.gamesStorage = config.gamesStorage || new MemoryStorage(config);
  this.replayStorage = config.replayStorage || new ReplayStorage(config);
}

GamesStorage.prototype = {
  saveGame: function(id, game) {
    this.gamesStorage.getGame(id, function(err, gi) {
      if (gi == undefined) {
        gi = GameInfoFactory.fromGame(game);
      }
      if (game.isFinished()) {
        if (!gi.finished) {
          gi.finish(game.getPlayers(), game.getGameResult(), game.getDuration());
        }
        game.getPlayers().forEach(function(p) {
          this.updatePlayer(p.getName(), p.getResultScore(), gi);
        }.bind(this));
      }
      this.gamesStorage.putGame(id, gi, function(err) {
        if (err) console.error(err);
      });

    }.bind(this));
    this.gamesStorage.addHub(game.getHub(), function() {});
  },

  getGameInfo: function(id, cb) {
    this.gamesStorage.getGame(id, cb);
  },

  initAndGetNextId: function(cb) {
    this.gamesStorage.initAndGetNextId(cb);
  },

  reset: function(cb) {
    if (this.gamesStorage.reset) {
      return this.gamesStorage.reset(cb);
    }
    return cb(null);
  },


  listGames: function(hub, paging, cb) {
    if (!cb) {
      cb = paging;
      paging = {};
    }
    if (!paging.page) paging.page = 0;
    if (!paging.perPage) paging.perPage = 100;
    this.gamesStorage.listGames(hub, paging, cb);
  },

  listHubs: function(cb) {
    this.gamesStorage.listHubs(cb);
  },

  registerHubs: function(hubs) {
    hubs.forEach(function(h) {
      this.gamesStorage.addHub(h, function() {});
    }.bind(this));
  },

  getPlayerInfo: function(name, cb) {
    this.gamesStorage.getPlayer(name, cb);
  },

  listPlayers: function(hub, cb) {
    this.gamesStorage.listPlayers(function(err, players) {
      if (err) return cb(err);
      cb(null, players.map(function(p) {
        return {
          name: p.name,
          score: p.scoreByHub[hub]
        }
      }));
    });
  },

  listActiveGames: function(hub, cb) {
    this.listGames(hub, function(err, games) {
      if (err) return cb(err);
      cb(null, games.filter(function(g) {return (!hub || g.hub == hub) && !g.finished}));
    });
  },


  getGameReplay: function(id, cb) {
    this.replayStorage.get(id, cb);
  },

  getGameReplayFile: function(id, cb) {
    this.replayStorage.getFile(id, cb);
  },

  updatePlayer: function(playerName, score, gameInfo) {
    this.gamesStorage.getPlayer(playerName, function(err, player) {
      if (!player) player = new PlayerInfo(playerName);
      player.registerGame(gameInfo, score, gameInfo.winner);
      this.gamesStorage.putPlayer(playerName, player, function(err) {
        if (err) console.log(err);
      });
    }.bind(this));
  },

  saveReplay: function(game, replay) {
    this.replayStorage.put(game.getId(), replay, function() {});
  }

};

module.exports = GamesStorage;

