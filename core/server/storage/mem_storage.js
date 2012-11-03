var fs = require('fs')
  , path = require('path');

/**
 * Stores games info in memory
 * @param config
 * @constructor
 */
function MemoryStorage(config) {
  this.games = [];
  this.gamesById = {};
  this.hubs = [];
  this.playersInfo = [];
  this.playersInfoByName = {};
}

MemoryStorage.prototype = {
  putGame: function(id, gameInfo, cb) {
    if (this.gamesById[id] == undefined) {
      this.games.push(gameInfo);
      this.gamesById[id] = gameInfo;
    }
    cb(null, gameInfo);
  },

  getGame: function(id, cb) {
    var game = this.gamesById[id];
    if (!game) return cb("Not found");
    return cb(null, game);
  },

  initAndGetNextId: function(cb) {
    cb(null, 1);
  },

  putPlayer: function(id, playerInfo, cb) {
    if (this.playersInfoByName[id] == undefined) {
      this.playersInfo.push(playerInfo);
      this.playersInfoByName[id] = playerInfo;
    }
    cb(null, playerInfo);
  },

  getPlayer: function(id, cb) {
    var player = this.playersInfoByName[id];
    return cb(player ? null : "Not found", player);
  },

  listPlayers: function(cb) {
    cb(null, this.playersInfo.slice());
  },

  listGames: function(hub, paging, cb) {
    var games = this.games.filter(function(g) {
      return !hub || g.hub == hub;
    });
    if (paging.originalSort) games = games.sort(paging.originalSort);
    var pagingInfo = {
      pagesCount: Math.ceil(games.length / paging.perPage)
    };
    pagingInfo.page = Math.min(paging.page, pagingInfo.pagesCount);
    pagingInfo.content = games.slice(pagingInfo.page * paging.perPage, Math.min((pagingInfo.page + 1) * paging.perPage, games.length));
    cb(null, pagingInfo);
  },

  addHub: function(hub, cb) {
    if (this.hubs.indexOf(hub) == -1) this.hubs.push(hub);
    cb(null);
  },

  listHubs: function(cb) {
    cb(null, this.hubs.slice());
  }
};

function ReplayStorage(config) {
  if (config && config.replaysDir) {
    this.replaysDir = path.normalize(config.replaysDir);
    fs.mkdir(this.replaysDir);
  }
  else {
    console.error("Replays directory is not specified");
  }
}

ReplayStorage.prototype = {
  put: function(id, replay, cb) {
    if (!this.replaysDir) {
      console.error("Cannot store replay - replays directory is not specified");
      return;
    }
    fs.writeFile(path.join(this.replaysDir, id + '.json'), JSON.stringify(replay), cb);
  },

  get: function(id, cb) {
    var fullPath = path.normalize(path.join(this.replaysDir, id + '.json'));
    if (path.dirname(fullPath) == this.replaysDir) {
      fs.readFile(fullPath, function(err, data) {
        if (err) return cb(err);
        return cb(null, JSON.parse(data));
      });
    }
    else {
      cb("Not found");
    }
  },

  getFile: function(id, cb) {
    var fullPath = path.normalize(path.join(this.replaysDir, id + '.json'));
    if (path.dirname(fullPath) == this.replaysDir) {
      return cb(null, fullPath);
    }
    else {
      cb("Not found");
    }
  }

};




module.exports = {
  MemoryStorage: MemoryStorage,
  ReplayStorage: ReplayStorage
};