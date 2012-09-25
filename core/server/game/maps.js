var fs = require('fs')
  , Map2D = require('./map2d.js');

/**
 * Maps collection and players balancer (simple right now)
 * @param config {dir, maps}
 * @param mapFactory
 * @constructor
 */
var Maps = function(config, mapFactory) {
  this.maps = [];
  this.mapFactory = mapFactory;
  function match(fileName) {
    if (!config.maps || config.maps.length == 0) return true;
    return config.maps.some(function(m) {return m == fileName;});
  }
  fs.readdirSync(config.dir).forEach(function(name) {
    if (!match(name)) return;
    console.log("Read map: " + name);
    var mapFile = fs.readFileSync('./maps/' + name);
    var lines = mapFile.toString().replace(/\r/g, '').split("\n");
    var opts = {};
    if (lines[0].charAt(0) == '{') {
      opts = JSON.parse(lines.splice(0,1)[0]);
    }
    var mapCtor = mapFactory.parseMapPart(lines);
    this.maps.push({
      name: name,
      mapCtor: mapCtor,
      opts: opts
    })
  }.bind(this));
  this.nextMap = 0;
  this.hasGamesFor = function(playerCount) {
    return playerCount <= this.maxPlayersCount() && playerCount >= this.minPlayersCount();
  };
  this.maxPlayersCount = function() {
    return 4;
  };
  this.minPlayersCount = function() {
    return 2;
  };

  this.getGameToStart = function(waitingPlayers) {
    if (waitingPlayers.length < this.minPlayersCount()) return {exists: false};
    var map = this.maps[this.nextMap];
    var map2d = new Map2D();
    return {
      exists: true,
      map: map2d,
      mapCtor: map.mapCtor,
      mapName: map.name,
      options: map.opts,
      players: waitingPlayers.slice(),
      waitMore: waitingPlayers.length < this.maxPlayersCount()
    }
  };
  this.gameStarted = function() {
    if (++this.nextMap == this.maps.length) this.nextMap = 0;
  }
};


module.exports = Maps;