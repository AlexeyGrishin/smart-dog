var fs = require('fs')
  , Map2D = require('./map2d.js')
  , _ = require('cloneextend');


var Hub = function(name, hubOptions, allMaps) {
  this.name = name;
  this.opts = hubOptions;
  this.maps = allMaps ? allMaps.slice().filter(this.matchMap.bind(this)) : [];
  this.nextMap = 0;
};

Hub.prototype = {

  getGameToStart: function(waitingPlayers) {
    var players = waitingPlayers.filter(function(w) {return this.matchHub(w.hub)}.bind(this));
    if (players.length < this.opts.min) return {exists: false};
    if (players.length > this.opts.max) {
      players = players.slice(0, this.opts.max);
    }
    var map = this.maps[this.nextMap];
    var map2d = new Map2D();
    return {
      exists: true,
      map: map2d,
      hub: this.name,
      mapCtor: map.mapCtor,
      mapName: map.name,
      options:_.cloneextend(this.opts.game, map.opts),
      players: players.slice(),
      waitMore: this._waitMore(players)
    }
  },

  _waitMore: function(players) {
    return players.length < this.opts.max;
  },

  getName: function() {
    return this.name;
  },

  gameStarted: function(game) {
    if (++this.nextMap == this.maps.length) this.nextMap = 0;
  },

  maxPlayersCount: function() {
    return this.opts.max;
  },

  minPlayersCount: function() {
    return this.opts.min;
  },

  matchHub: function(hub) {
    return hub && this.name.toLowerCase() == hub.toLowerCase();
  },

  matchMap: function(map) {
    if (!this.opts.maps || this.opts.maps.length == 0) return true;
    return this.opts.maps.some(function(m) {
      return map.name == m || map.name.indexOf(m) == 0;
    })
  }

};

var DefaultHub = function(defOptions, allMaps) {
  Hub.call(this, "default", defOptions, allMaps);
};

DefaultHub.prototype = new Hub();
DefaultHub.prototype.matchHub = function(hub) {
  return hub == undefined || Hub.prototype.matchHub.call(this, hub);
};
DefaultHub.prototype._waitMore = function(players) {
  if (players.length == this.opts.max) return false;
  if (players.length < this.opts.min) return true;
  return Math.random() > 0.5;
};


/**
 * Maps collection and players balancer (simple right now)
 * @param config {dir, maps}
 * @param mapFactory
 * @constructor
 */
var Maps = function(mapConfig, defaultGameConfig, mapFactory) {
  this.maps = [];
  function match(fileName) {
    if (!mapConfig.maps || mapConfig.maps.length == 0) return true;
    return mapConfig.maps.some(function(m) {return m == fileName;});
  }
  fs.readdirSync(mapConfig.dir).forEach(function(name) {
    var fpath = './' + mapConfig.dir + '/' + name;
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
  this.hubs = [new DefaultHub(defaultGameConfig, this.maps)];

  this.findHub = function(name) {
    var hubs = this.hubs.filter(function(h) {return h.matchHub(name)});
    return hubs.length > 0 ? hubs[0] : null;
  };

  this.getGameToStart = function(waitingPlayers, playerOrHub) {
    var targetHubName = typeof playerOrHub == 'string' ? playerOrHub : playerOrHub.hub;
    var hub = this.findHub(targetHubName);
    if (!hub) return {exists: false, error: "No such hub"};
    return hub.getGameToStart(waitingPlayers);
  };

  this.gameStarted = function(game) {
    this.findHub(game.hub).gameStarted(game);
  };

  this.addHub = function(name, options) {
    this.hubs.push(new Hub(name, options, this.maps));
  };

  this.getHubs = function() {
    return this.hubs.map(function(h) {return h.getName()});
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