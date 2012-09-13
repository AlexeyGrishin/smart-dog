var fs = require('fs')
  , Map2D = require('./map2d.js');

/**
 * Maps collection
 * TODO: make configurable - players counts, map directory, map files - shall be able to say 'use only map4.txt with 4 players' via config - that would be useful for debug
 * @param mapDir
 * @param mapFactory
 * @constructor
 */
var Maps = function(mapDir, mapFactory) {
  this.maps = [];
  this.mapFactory = mapFactory;
  fs.readdirSync(mapDir).forEach(function(name) {
    var mapFile = fs.readFileSync('./maps/' + name);
    var mapCtor = mapFactory.parseMapPart(mapFile.toString().replace(/\r/g, '').split("\n"));
    this.maps.push({
      name: name,
      mapCtor: mapCtor
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
  }
};

Maps.prototype.initGameMap = function(game, players) {
  if (!this.hasGamesFor(players.length)) throw new Error("There is no maps for " + players.length + " players");
  //var map = this.maps[Math.floor(Math.random() * this.maps.length)];
  var map = this.maps[this.nextMap];
  this.nextMap++;
  if (this.nextMap == this.maps.length) this.nextMap = 0;
  var map2d = new Map2D();
  game.setMap(map.name, map2d);
  this.mapFactory.fillMap(map.mapCtor, players, map2d, game);
};

module.exports = Maps;