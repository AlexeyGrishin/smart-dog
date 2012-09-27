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
  function match(fileName) {
    if (!config.maps || config.maps.length == 0) return true;
    return config.maps.some(function(m) {return m == fileName;});
  }
  fs.readdirSync(config.dir).forEach(function(name) {
    var fpath = './' + config.dir + '/' + name;
    if (!fs.statSync(fpath).isFile() || !match(name)) return;
    console.log("Read map: " + name);
    var readMap = Maps.readMap(fpath);
    var mapCtor = mapFactory.parseMapPart(readMap.map);
    this.maps.push({
      name: name,
      mapCtor: mapCtor,
      opts: readMap.opts
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

Maps.readMap = function(file) {
  var mapFile = fs.readFileSync(file);
  var lines = mapFile.toString().replace(/\r/g, '').split("\n")
    .map(function(s) {return s.trim();})
    .filter(function(s) {return s.length > 0});
  var opts = {};
  if (lines[0].charAt(0) == '{') {
    opts = JSON.parse(lines.splice(0,1)[0]);
  }
  return {
    map: lines,
    opts: opts
  }
};


module.exports = Maps;