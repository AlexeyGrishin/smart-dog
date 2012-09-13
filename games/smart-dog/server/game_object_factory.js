var GameObject = require('../../../core/server/game/game_object.js')
  , Dog = require('./dog.js')
  , Sheep = require('./sheep.js')
  , util = require('util')
  , Game = require('../../../core/server/game/game.js')
  , PlayerInterface = require('./player');

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

var Factory = {
  //TODO: read from config
  options: {
    waitForTurn: 300000,
    visibilityRadius: 4
  },
  types: {
    Grass: Grass,
    Wall: Wall,
    Site: Site,
    Tree: Tree,
    Dog: Dog,
    Sheep: Sheep
  },

  fillMap: function(mapCtor, players, map2d, game) {
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
              var obj = new mObj.object(game, {x:x+dx, y:y+dy, owner: owner, layer: "object"});
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

  createGame: function() {
    return new Game(new Logic(), this, this.options);
  },

  createPlayer: function(game, info, id) {
    return new PlayerInterface(game, id, info, this.options);
  }
};

var Logic = function() {
};

Logic.prototype = {
  init: function(game) {
    this.map = game.getMap();
    this.landscape = Factory.encodeMap(game.getMap().cols, game.getMap().rows, game.getMap().getAll("landscape"));
    this.players = game.getPlayers();
    this.result = {
      finished: false
    }
  },

  beforeTurn: function(turn) {

  },

  afterTurn: function(turn) {
    this.turn = turn;
    if (turn >= 50) {
      this.stopGame('turnsLimit');
    }
  },

  getBriefStatus: function(brief) {
    return brief;
  },

  _genState: function(state) {
    state.landscape = this.landscape;
    return state;
  },

  getGameResult: function() {
    return this.result;
  },

  stopGame: function(reason, playerCausedStop) {
    this.result.reason = reason;
    this.result.finished = true;
    this.result.playerCausedStop = playerCausedStop;
    var maxScore = -1;
    for (var i = 0; i < this.players.length; i++) {
      var score = this.players[i].calculateScore(); //TODO: cache score inside player
      if (this.players[i] != playerCausedStop && score > maxScore) {
        this.result.winner = this.players[i];
        maxScore = score;
      }
    }
  }

};

module.exports = Factory;
