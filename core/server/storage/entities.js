//Represents storable player info.
//Has public fields for simplifying db mapping
function PlayerInfo(name) {
  this.name = name;
  this.type = "PlayerInfo";
  this.games = [];
  this.gamesCount = 0;
  this.winsCount = 0;
  this.score = 0;
  this.scoreByHub = {};
  this.__defineGetter__('hubs', function() {return Object.keys(this.scoreByHub)});

}

PlayerInfo.prototype = {
  registerGame: function(game, score, winner) {
    this.games.push({
      id: game.id,
      map: game.map,
      hub: game.hub,
      error: game.error,
      players: game.players,
      score: score,
      isWinner: winner == this.name});
    this.score = this.games.map(function(g) {return g.score}).reduce(function(a,b) {return a+b;}, 0) / this.games.length;
    function avgScore(games) {
      return games.map(function(g) {return g.score}).reduce(function(a,b) {return a+b;}, 0) / games.length
    }
    this.scoreByHub[game.hub] = avgScore(this.games.filter(function(f) {return f.hub == game.hub}));
    this.score = avgScore(this.games);
    this.gamesCount++;
    if (winner == this.name) {
      this.winsCount++;
    }
  }
};

//Represents storable game info
function GameInfo() {
  this.type = "GameInfo"; //TODO: for some reason 'this.constructor.name' returns 'Object' for GameInfo and PlayerInfo. Do not know why...
}

GameInfo.prototype = {

  finish: function(players, result, duration) {
    this.finished = true;
    this.game = null;
    this.playersInfo = players.map(function(p) {
      return {name:p.getName(), score:p.getResultScore(), isWinner: p == result.winner}
    });
    this.winner = result.winner ? result.winner.name : null;
    this.error = result.error;
    this.duration = duration;
  },


  get map() {
    return this.mapName;
  },

  //return array with players info {name: <name>, score: <score>, isWinner: true/false}
  get players() {
    return this.playersInfo;
  }
};

var GameInfoFactory = {};

GameInfoFactory.fromRealGame = function(game) {
  var gi = new GameInfo();
  gi.id = game.getId();
  gi.duration = 0;
  gi.turn = game.getTurn();
  gi.mapName = game.getMapName();
  gi.hub = game.getHub();
  gi.finished = game.isFinished();
  gi.playersInfo = game.getPlayers().map(function(p) {
    return {name:p.getName()};
  });
  return gi;
};

GameInfoFactory.fromFinishedGame = function(game) {
  var gi = GameInfoFactory.fromRealGame(game);
  gi.finish(game.getPlayers(), game.getGameResult(), game.getDuration());
  return gi;
};

GameInfoFactory.fromGame = function(game) {
  return game.isFinished() ? GameInfoFactory.fromFinishedGame(game) : GameInfoFactory.fromRealGame(game);
};



module.exports = {
  PlayerInfo: PlayerInfo,
  GameInfo: GameInfo,
  GameInfoFactory: GameInfoFactory
};
