var GameObject = require('../../../core/server/game/game_object.js')
  , Dog = require('./dog.js')
  , Sheep = require('./sheep.js')
  , util = require('util')
  , Game = require('../../../core/server/game/game.js')
  , PlayerInterface = require('./player')
  , _ = require('cloneextend');

function Wall() {
  GameObject.apply(this, arguments);
  this.__defineGetter__('traversable', function() {return false});
}

function Tree() {
  GameObject.apply(this, arguments);
  this.__defineGetter__('traversable', function() {return false});
}
function Grass() {
  GameObject.apply(this, arguments);
  this.__defineGetter__('traversable', function() {return true});
}
function Site() {
  GameObject.apply(this, arguments);
  this.__defineGetter__('traversable', function() {return true});
}

function makeLandscape(clss) {
  clss.forEach(function(cls) {
    util.inherits(cls, GameObject);
    cls.prototype._subscribe = function() {}
  });
}

makeLandscape([Site, Wall, Tree, Grass]);

var Fillers = {
  1: [
    [1]
  ],
  2: [
    [1,0],
    [0,2]
  ],
  3: [
    [1,0,0,0,0],
    [0,0,0,3,0],
    [0,2,0,0,0]
  ],
  4: [
    [0,0,0,4,0,0],
    [0,1,0,0,0,0],
    [0,0,0,0,3,0],
    [0,0,2,0,0,0],
    [0,0,0,0,0,0]
  ]
};

var Factory = function(options) {
  this.options = _.extend({
    "games": {
      "default": {
        waitForTurn: 300000,
        dogVisibilityR: 4,
        dogBarkingR: 4,
        sheepStandBy: 4,
        sheepScaryTurns: 4,
        turnsLimit: 10,
        dogScaryTurns: 2
      }}}, options || {})
};
Factory.prototype = {
  types: {
    Grass: Grass,
    Wall: Wall,
    Site: Site,
    Tree: Tree,
    Dog: Dog,
    Sheep: Sheep
  },

  fillMap: function(mapCtor, players, map2d, game, options) {
    var playersCount = players.length;
    var filler = Fillers[playersCount];
    var y = 0, x = 0;
    map2d.setSize(filler.length * mapCtor.length, filler[0].length * mapCtor[0].length);
    for (var fRow = 0; fRow < filler.length; fRow++) {
      y = fRow * mapCtor.length;
      for (var fCol = 0; fCol < filler[0].length; fCol++) {
        x = fCol * mapCtor[0].length;
        var fillerPlayer = filler[fRow][fCol] - 1;
        for (var dy = 0; dy < mapCtor.length; dy++) {
          for (var dx = 0; dx < mapCtor[0].length; dx++) {
            var mObj, owner;
            if (fillerPlayer > -1) {
              mObj = mapCtor[dy][dx];
              owner = players[fillerPlayer];
            }
            else {
              mObj = this.empty();
              owner = undefined;
            }
            if (mObj.object) {
              var obj = new mObj.object(game, _.replace({x:x+dx, y:y+dy, owner: owner, layer: "object"}, options));
              map2d.add("object", obj, x+dx, y+dy);
            }
            if (mObj.landscape) {
              map2d.add("landscape", new mObj.landscape(game, {owner: owner, layer: "landscape"}), x+dx, y+dy);
            }
          }
        }
      }
    }
  },

  _getOptions: function(gameType) {
    //by default - default
    return _.clone(this.options.games["default"]);
  },

  empty: function() {
    return {
      landscape: Grass
    };
  },

  //returns array of arrays of object constructors
  parseMapPart: function(charMap) {
    var partWidth = charMap[0].length;
    var partHeight = charMap.length;
    var mapCtor = [];
    for (var row = 0; row < partHeight; row++) {
      var rowArr = [];
      for (var col = 0; col < partWidth; col++) {
        var mapChar = charMap[row][col];
        rowArr.push(this.createFromCharMap(mapChar));
      }
      mapCtor.push(rowArr);
    }
    return mapCtor;
  },

  createFromCharMap: function(mapChar) {
    switch (mapChar) {
      case '#':
        return {
          landscape: Wall
        };
        break;
      case '@':
        return {
          landscape: Grass,
          object: Dog
        };
        break;
      case 'o':
        return {
          landscape: Site,
          object: Sheep
        };
        break;
      case '*':
        return {
          landscape: Grass,
          object: Sheep
        };
        break;
      case '.':
        return {
          landscape: Grass
        };
        break;
      case '-':
        return {
          landscape: Site
        };
        break;
      default:
        throw new Error("UnknownCharacter - " + mapChar);
    }
  },

  encodeMap: function(width, height, gameObjects) {
    var map = [];
    for (var i = 0; i < height; i++) {
      var line = [];
      for (var j = 0; j < width; j++) {
        line.push(".");
      }
      map.push(line);
    }
    gameObjects.forEach(function(g) {
      var chr;
      switch (g.type) {
        case 'Wall': chr = '#'; break;
        case 'Site': chr = "" + g.owner.id; break;
        default: chr = '.';
      }
      map[g.y][g.x] = chr;
    });
    for (var i = 0; i < height; i++) {
      map[i] = map[i].join("");
    }
    return map;
  },

  /**
   *
   * @param id game id
   * @param gameToStart object returned by game balancer:
   *  {
   *    map: map object instance,
   *    mapCtor: map creator (returned by this factory),
   *    mapName: map name,
   *    players: array[] of {
   *      name: player name[,
   *      io: controller {setPlayerInterface}]
   *    }
   *  }
   * @return {*}
   */
  createGame: function(id, gameToStart) {
    var options = gameToStart ? _.extend(this._getOptions(), _.clone(gameToStart.options)) : this._getOptions();
    var game = new SmartDogGame(options);
    game.setId(id);
    var pid = 1;
    //TODO: move player/controller connection upper
    game.setPlayers(gameToStart.players.map(function(p) {
      var pi = new PlayerInterface(game, pid++, {name: p.name}, options);
      if (p.io) p.io.setPlayerInterface(pi);
      return pi;
    }.bind(this)));
    game.setMap(gameToStart.mapName, gameToStart.map);
    this.fillMap(gameToStart.mapCtor, game.getPlayers(), gameToStart.map, game, options);
    game._.landscape = this.encodeMap(game._.map.cols, game._.map.rows, game._.map.getAll("landscape"));
    options.ownSheepsCount = game.getMap().getObjectsBy("object", function(o) {return o instanceof Sheep && o.owner.id == 1}).length;
    options.maxSheepsCount = game.getMap().getObjectsBy("landscape", function(o) {return o instanceof Site && o.owner.id == 1}).length;
    return game;
  }
};

var SmartDogGame = function(options) {
  Game.call(this, options);
  this.on(Game.Event.Init, this.init.bind(this));
  //this.on(Game.Event.BeforeTurn, this.beforeTurn.bind(this));
  this.on(Game.Event.AfterTurn, this.afterTurn.bind(this));
  var _ = this._;
  this._.result = {
    finished: false
  }
};

util.inherits(SmartDogGame, Game);

SmartDogGame.prototype.init = function() {
};


SmartDogGame.prototype.afterTurn = function() {
  this.emit(Sheep.Event.DoMove);
  this.emit(Sheep.Event.DoFear);
  if (this._.turn >= this._.o.turnsLimit) {
    this._stopGame('turnsLimit');
  }

};


SmartDogGame.prototype._genState = function() {
  var state = Game.prototype._genState.call(this);
  state.landscape = this._.landscape;
  return state;
};

SmartDogGame.prototype._getGameResult = function() {
  return this._.result;
};

SmartDogGame.prototype._stopGame = function(reason, playerCausedStop) {
  var _ = this._;
  _.result.reason = reason;
  _.result.finished = true;
  _.result.playerCausedStop = playerCausedStop;
  var maxScore = -1;
  for (var i = 0; i < _.players.length; i++) {
    var score = _.players[i].calculateScore(); //TODO: cache score inside player
    if (_.players[i] != playerCausedStop && score > maxScore) {
      _.result.winner = _.players[i];
      maxScore = score;
    }
  }
};

module.exports = function(config) {
  return new Factory(config);
};

module.exports.types = Factory.prototype.types;
