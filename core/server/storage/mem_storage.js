var fs = require('fs')
  , path = require('path');

function PlayerInfo(name) {
  this._name = name;
  this._games = [];
  this._gamesCount = 0;
  this._winsCount = 0;
  this._score = 0;
  this.__defineGetter__('name', function() {return this._name});
  this.__defineGetter__('gamesCount', function() {return this._gamesCount});
  this.__defineGetter__('winsCount', function() {return this._winsCount});
  this.__defineGetter__('games', function() {return this._games});
  this.__defineGetter__('averageScore', function() {return this._score});
}

PlayerInfo.prototype = {
  registerGame: function(gameId, score, isWinner) {
    this._games.push({id: gameId, score: score});
    this._score = this._games.map(function(g) {return g.score}).reduce(function(a,b) {return a+b;}, 0) / this._games.length;
    this._gamesCount++;
    if (isWinner) {
      this._winsCount++;
    }
  }
};


function MemoryStorage(config) {
  this.games = [];
  this.gamesById = {};
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
      this.games.push(game);
      this.gamesById[id] = game;
    }
    if (game.isFinished()) {
      var winner = game.getGameResult().winner;
      game.getPlayers().forEach(function(p) {
        this.updatePlayer(p.getName(), p.calculateScore(), game.getId(), winner && winner.getId() == p.getId());
      }.bind(this));
    }
  },

  getGameInfo: function(id, cb) {
    var game = this.gamesById[id];
    if (!game) return cb("Not found");
    return cb(null, game);
  },

  listGames: function(cb) {
    cb(null, this.games);
  },

  getPlayerInfo: function(name, cb) {
    var player = this.playersInfoByName[name];
    if (!player) return cb("Not found");
    cb(null, player);
  },

  listPlayers: function(cb) {
    cb(null, this.playersInfo);
  },

  listActiveGames: function(cb) {
    cb(null, this.games.filter(function(g) {return !g.isFinished()}));
  },

  listFinishedGames: function(from, count, cb) {
    var finished = this.games.filter(function(g) {return g.isFinished()});
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

  updatePlayer: function(playerName, score, gameId, isWinner) {
    var player = this.playersInfoByName[playerName];
    if (!player) {
      player = new PlayerInfo(playerName);
      this.playersInfo.push(player);
      this.playersInfoByName[playerName] = player;
    }
    player.registerGame(gameId, score, isWinner);
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