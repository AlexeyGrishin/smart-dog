
var GameServer = function(maps, gameFactory, options) {
  this.games = [];
  this.gamesById = {};
  this.activeGames = [];
  this.waiting = [];
  this.nextGameId = 1;
  this.maps = maps;
  this.options = options;
  this.gameFactory = gameFactory;
};

var IoInterface = {
  wait: function(players) {},
  setPlayerInterface: function(playerInterface) {},
  //next methods depend on player
  init: function(playerInterface) {},
  makeTurn: function() {},
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
      playerInfo.io.wait(this.waiting.length);
    }
  },

  startGame: function() {
    //guard
    if (this.waiting.length == 0) return;
    clearTimeout(this.waitForAnotherPlayer);
    var players = this.waiting.splice(0, this.waiting.length);
    var game = this.gameFactory.createGame();
    var id = this.nextGameId++;
    game.setId(id);
    game.setPlayers(players);
    this.maps.initGameMap(game, game.getPlayers());
    this.games.push(game);
    this.activeGames.push(game);
    this.gamesById[id] = game;
    game.start();
    game.on('game.stop', function(results) {
      this.activeGames.splice(this.activeGames.indexOf(game), 1);
    }.bind(this));

  },

  listen: function(id, callback) {
    var game = this.gamesById[id];
    if (!game) {
      callback('There is no game with given id');
      return;
    }
    var callbacks = {
      onTurn: function() {
        callback(undefined, game.getId(), game.toState());
      },
      onStop: function(results) {
        callback('game.stop', game.getId(), game.toState())
      }
    };
    game.on('game.turn', callbacks.onTurn);
    game.on('game.stop', callbacks.onStop);
    if (game.isFinished()) {
      callbacks.onStop();
    }
    else {
      callbacks.onTurn();
    }
    return callbacks;
  },

  unlisten: function(id, callbacks) {
    var game = this.gamesById[id];
    if (game) {
      game.removeListener('game.turn', callbacks.onTurn);
      game.removeListener('game.stop', callbacks.onStop);
    }
  },

  listGames: function(onlyActive) {
    return (onlyActive ? this.activeGames : this.games).map(function(g) {
      return {
        id: g.getId(),
        players: g.getPlayers().map(function(p) {return p.name}),
        brief: g.getBriefStatus(),
        finished:g.isFinished()
      }
    });
  },

  getGame: function(id) {
    var game = this.gamesById[id];
    return game;
  }


};


module.exports = GameServer;