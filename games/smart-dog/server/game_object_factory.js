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
    [1,2]
  ],
  3: [
    [1,0,0],
    [0,2,0],
    [0,0,3]
  ],
  4: [
    [1,0,3,0],
    [0,2,0,4]
  ]
};

var Factory = function() {
  this.options = {
        waitForTurn: 300000,
        dogVisibilityR: 4,
        dogBarkingR: 4,
        sheepStandBy: 4,
        sheepScaryTurns: 4,
        turnsLimit: 10,
        dogScaryTurns: 2
      };
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
    this.shared = {
      grass: new Grass(game, {layer: "landscape", landscape: true}),
      wall: new Wall(game, {layer: "landscape", landscape: true}),
      tree: new Tree(game, {layer: "landscape", landscape: true}),
      sites: []
    };
    players.forEach(function(p) {
      this.shared.sites.push(new Site(game, {layer: "landscape", landscape: true, owner: p}));
    }.bind(this));
    map2d.setSize(filler.length * mapCtor.length, filler[0].length * mapCtor[0].length);
    for (var fRow = 0; fRow < filler.length; fRow++) {
      y = fRow * mapCtor.length;
      for (var fCol = 0; fCol < filler[0].length; fCol++) {
        x = fCol * mapCtor[0].length;
        var fillerPlayer = filler[fRow][fCol] - 1;
        var owner = undefined;
        if (fillerPlayer > -1) {
          owner = players[fillerPlayer];
          owner.setArea(x, y, x + mapCtor[0].length - 1, y + mapCtor.length - 1);
        }
        for (var dy = 0; dy < mapCtor.length; dy++) {
          for (var dx = 0; dx < mapCtor[0].length; dx++) {
            var mObj;
            if (fillerPlayer > -1) {
              mObj = mapCtor[dy][dx];
            }
            else {
              mObj = this.empty();
            }
            if (mObj.object) {
              var obj = new mObj.object(game, _.replace({x:x+dx, y:y+dy, owner: owner, layer: "object"}, options));
              map2d.add("object", obj, x+dx, y+dy);
            }
            if (mObj.landscape) {
              map2d.add("landscape", this._createLandscape(mObj.landscape, game, fillerPlayer, {owner: owner, layer: "landscape", landscape: true}), x+dx, y+dy);
            }
          }
        }
      }
    }
    this.shared = null;
  },

  _createLandscape: function(type, game, fillerPlayer, properties) {
    return new type(game, properties);
  },

  _getOptions: function() {
    return _.clone(this.options);
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
    var res = {
      '#': {landscape: Wall},
      '^': {landscape: Tree},
      '@': {landscape: Grass, object: Dog},
      '*': {landscape: Grass, object: Sheep},
      'o': {landscape: Site, object: Sheep},
      '-': {landscape: Site},
      '.': {landscape: Grass}
    }[mapChar];
    if (!res) throw new Error("UnknownCharacter - " + mapChar);
    return res;
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
        case 'Tree': chr = '^'; break;
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
   *    options: map options,
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
    game.setHub(gameToStart.hub);
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
    var allSheeps = game.getMap().getObjectsBy("object", function(o) {return o instanceof Sheep && o.owner.id == 1});
    options.maxSheepsCount = allSheeps.length;
    options.iniSheepsCount = allSheeps.filter(function(o) {return game.getMap().getLandscape(o.x, o.y) instanceof Site}).length;
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
  this.emit(Sheep.Event.DoMoveScaredSheeps);
  this.emit(Sheep.Event.DoMove);
  this.emit(Sheep.Event.DoFear);
  if (this._.turn >= this._.o.turnsLimit - 1) {
    this._stopGame();
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


SmartDogGame.prototype._getWinner = function() {
  var _ = this._;
  if (_.result.playerCausedStop) return null;
  var maxScore = -10; //minimum for score
  var winner = null;
  for (var i = 0; i < _.players.length; i++) {
    var score = _.players[i].getResultScore(); //TODO: cache score inside player
    if (_.players[i] != _.result.playerCausedStop && score > maxScore) {
      winner = _.players[i];
      maxScore = score;
    }
  }
  return winner;
};

module.exports = function() {
  return new Factory();
};

module.exports.types = Factory.prototype.types;
