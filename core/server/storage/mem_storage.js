var fs = require('fs')
  , path = require('path');

function PlayerInfo(name) {
  this._name = name;
  this._games = [];
  this._gamesCount = 0;
  this._winsCount = 0;
  this._score = 0;
  this._scoreByHub = {};
  this.__defineGetter__('name', function() {return this._name});
  this.__defineGetter__('gamesCount', function() {return this._gamesCount});
  this.__defineGetter__('winsCount', function() {return this._winsCount});
  this.__defineGetter__('games', function() {return this._games});
  this.__defineGetter__('averageScore', function() {return this._score});
  this.__defineGetter__('scoreByHub', function() {return this._scoreByHub});
  this.__defineGetter__('hubs', function() {return Object.keys(this._scoreByHub)});
}

PlayerInfo.prototype = {
  registerGame: function(game, score, winner) {
    this._games.push({
      id: game.id,
      map: game.map,
      hub: game.hub,
      error: game.error,
      players: game.players,
      score: score,
      isWinner: winner == this.name});
    this._score = this._games.map(function(g) {return g.score}).reduce(function(a,b) {return a+b;}, 0) / this._games.length;
    function avgScore(games) {
      return games.map(function(g) {return g.score}).reduce(function(a,b) {return a+b;}, 0) / games.length
    }
    this._scoreByHub[game.hub] = avgScore(this._games.filter(function(f) {return f.hub == game.hub}));
    this._score = avgScore(this._games);
    this._gamesCount++;
    if (winner == this._name) {
      this._winsCount++;
    }
  }
};

function GameInfo() {

}

GameInfo.fromRealGame = function(game) {
  var gi = new GameInfo();
  gi._game = game;
  gi._id = game.getId();
  gi._turn = game.getTurn();
  gi._mapName = game.getMapName();
  gi._hub = game.getHub();
  gi._finished = game.isFinished();
  gi._players = game.getPlayers().map(function(p) {
    return {name:p.getName()};
  });
  return gi;
};

GameInfo.fromFinishedGame = function(game) {
  var gi = GameInfo.fromFinishedGame(game);
  gi.finish(game.getPlayers(), game.getGameResult());
  return gi;
};

GameInfo.fromGame = function(game) {
  return game.isFinished() ? GameInfo.fromFinishedGame(game) : GameInfo.fromRealGame(game);
};

GameInfo.prototype = {
  get id() {
    return this._id;
  },

  get error() {
    return this._error;
  },

  finish: function(players, result) {
    this._finished = true;
    this._game = null;
    this._players = players.map(function(p) {
      return {name:p.getName(), score:p.getResultScore(), isWinner: p == result.winner}
    });
    this._winner = result.winner;
    this._error = result.error;
  },

  get winner() {
    return this._winner;
  },

  get runningGame() {
    return this._game;
  },

  get map() {
    return this._mapName;
  },

  get hub() {
    return this._hub;
  },

  get finished() {
    return this._finished;
  },

  //return array with players info {name: <name>, score: <score>, isWinner: true/false}
  get players() {
    return this._players;
  }
};




function MemoryStorage(config) {
  this.games = [];
  this.gamesById = {};
  this.hubs = [];
  this.playersInfo = [];
  this.playersInfoByName = {};
  if (config && config.replaysDir) {
    this.replaysDir = path.normalize(config.replaysDir);
    fs.mkdir(this.replaysDir);
  }
  else {
    console.error("Replays directory is not specified");
  }
}

MemoryStorage.prototype = {
  saveGame: function(id, game) {
    if (this.gamesById[id] == undefined) {
      var gi = GameInfo.fromGame(game);
      this.games.push(gi);
      this.gamesById[id] = gi;
    }
    if (this.hubs.indexOf(game.getHub()) == -1) {
      this.hubs.push(game.getHub());
    }
    if (game.isFinished()) {
      var gi = this.gamesById[id];
      if (!gi.finished) gi.finish(game.getPlayers(), game.getGameResult());
      game.getPlayers().forEach(function(p) {
        this.updatePlayer(p.getName(), p.getResultScore(), gi, p.getId());
      }.bind(this));
    }
  },

  getGameInfo: function(id, cb) {
    var game = this.gamesById[id];
    if (!game) return cb("Not found");
    return cb(null, game);
  },

  getRunningGame: function(id, cb) {
    var game = this.gamesById[id];
    if (!game) return cb("Not found");
    if (game.finished) return cb("Finished");
    return cb(null, game.runningGame());
  },

  listGames: function(hub, paging, cb) {
    if (!cb) {
      cb = paging;
      paging = {};
    }
    if (!paging.page) paging.page = 0;
    if (!paging.perPage) paging.perPage = 100;
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

  listHubs: function(cb) {
    cb(null, this.hubs.slice());
  },

  registerHubs: function(hubs) {
    this.hubs = this.hubs.concat(hubs.slice());
  },

  getPlayerInfo: function(name, cb) {
    var player = this.playersInfoByName[name];
    if (!player) return cb("Not found");
    cb(null, player);
  },

  listPlayers: function(hub, cb) {
    cb(null, this.playersInfo.map(function(p) {
      return {
        name: p.name,
        score: p.scoreByHub[hub]
      }
    }));
  },

  listActiveGames: function(hub, cb) {
    cb(null, this.games.filter(function(g) {return (!hub || g.hub == hub) && !g.finished}));
  },

  listFinishedGames: function(from, count, cb) {
    var finished = this.games.filter(function(g) {return g.finished});
    var required = finished.slice(from, from+count);
    cb(null, required);
  },

  getGameReplay: function(id, cb) {
    var fullPath = path.normalize(path.join(this.replaysDir, id + '.json'));
    if (path.dirname(fullPath) == this.replaysDir) {
      fs.readFile(fullPath, function(err, data) {
        if (err) return cb(err);
        return cb(null, JSON.parse(data));
      });
    }
    else {
      cb("invalid id");
    }
  },

  getGameReplayFile: function(id, cb) {
    var fullPath = path.normalize(path.join(this.replaysDir, id + '.json'));
    if (path.dirname(fullPath) == this.replaysDir) {
      return cb(null, fullPath);
    }
    else {
      cb("invalid id");
    }

  },

  getGameLastState: function(id, cb) {
    var game = this.gamesById[id];
    if (!game) return cb("Not found");
    return cb(null, game.toState());
  },

  updatePlayer: function(playerName, score, gameInfo, playerId) {
    var player = this.playersInfoByName[playerName];
    if (!player) {
      player = new PlayerInfo(playerName);
      this.playersInfo.push(player);
      this.playersInfoByName[playerName] = player;
    }
    player.registerGame(gameInfo, score, gameInfo.winner);
  },

  saveReplay: function(game, replay) {
    if (!this.replaysDir) {
      console.error("Cannot store replay - replays directory is not specified");
      return;
    }
    fs.writeFile(path.join(this.replaysDir, game.getId() + '.json'), JSON.stringify(replay));
  }

};

module.exports = MemoryStorage;