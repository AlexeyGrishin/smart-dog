var GameObject = require('./game_object.js')
  , Dog = require('./dog.js')
  , util = require('util')
  , Game = require('./game')
  , PlayerInterface = require('./player');

function Sheep() {
  GameObject.apply(this, arguments);

}

function Wall() {
  GameObject.apply(this, arguments);
  this.traversable = false;
}

function Tree() {
  GameObject.apply(this, arguments);
  this.traversable = false;
}
function Grass() {
  GameObject.apply(this, arguments);
  this.traversable = true;
}
function Site() {
  GameObject.apply(this, arguments);
  this.traversable = true;
}
util.inherits(Sheep, GameObject);
util.inherits(Site, GameObject);
util.inherits(Grass, GameObject);
util.inherits(Tree, GameObject);
util.inherits(Wall, GameObject);


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
      case '*':
        return {
          landscape: Site,
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
    this.players = game.getPlayers();
    this.result = {
      finished: false
    }
  },

  beforeTurn: function(turn) {

  },

  afterTurn: function(turn) {
    this.turn = turn;
    if (turn >= 500) {
      this.stopGame('turnsLimit');
    }
  },

  getBriefStatus: function(brief) {
    return brief;
  },

  genState: function(state) {
    return state;
  },

  getGameResult: function() {
    return this.result;
  },

  stopGame: function(reason, playerCausedStop) {
    this.result.reason = reason;
    this.result.finished = true;
    this.result.playerCausedStop = playerCausedStop;
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i] != playerCausedStop) {
        this.result.winner = this.players[i];
        break;
      }
    }
  }

};

module.exports = Factory;
