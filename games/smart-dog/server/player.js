var Dog = require('./dog')
  , constants = require('./consts.js')
  , Sheep = require('./sheep.js')
  , Game = require('../../../core/server/game/game.js')
  , _ = require('cloneextend');

var PlayerInterface = function(game, ownerId, info, options) {
  this.game = game;
  this.o = options;
  this.id = ownerId;
  this.info = info;
  this.name = info.name;
  //this.game.on(Game.Event.AfterTurn, this.generateState.bind(this));
  this.controller = PlayerController;
};

var PlayerController = {
  init: function(playerInterface) {},
  sendTurn: function() {},
  finished: function(winner, gameResult) {},
  close: function() {}
};

PlayerInterface.prototype = {
  init: function() {
    this.map = this.game.getMap();
    //TODO: constants for layers
    this.dogs = this.map.getObjectsBy("object", function(o) {return o instanceof Dog && o.owner.id == this.id}.bind(this));
    this.site = this.map.getObjectsBy("landscape", function(o) {return o.type == "Site" && o.owner.id == this.id}.bind(this));
    /*var area = this.map.getObjectsBy("landscape", function(o) {return o.owner && o.owner.id == this.id}.bind(this));
    var xes = area.map(function(o) {return o.x}), yes = area.map(function(o) {return o.y});
    this.area = {x1: Math.min.apply(null, xes),
      x2: Math.max.apply(null, xes),
      y1: Math.min.apply(null, yes),
      y2: Math.max.apply(null, yes)
    };*/
    this.dogById = {};
    for (var i = 0; i < this.dogs.length; i++) {
      this.dogById[this.dogs[i].id] = this.dogs[i];
    }
    this.savedState = this._genState();
    this.controller.init(this);
    this.game.on(Game.Event.Stop, this._onStop.bind(this));
  },

  getName: function() {
    return this.name;
  },

  getId: function() {
    return this.id;
  },

  getArea: function() {
    return this.area;
  },

  setArea: function(x1, y1, x2, y2) {
    this.area = {x1:x1, y1:y1, x2:x2, y2:y2};
  },

  calculateScore: function() {
    var sheepsOnSite = this._calculateSheeps();
    if (sheepsOnSite <= this.o.ownSheepsCount) {
      return 5*(sheepsOnSite / this.o.ownSheepsCount);
    }
    else {
      return 5 + 5*((sheepsOnSite - this.o.ownSheepsCount) / (this.o.maxSheepsCount - this.o.ownSheepsCount));
    }
  },

  _calculateSheeps: function() {
    if (!this.site) return 0;
    var sheepsOnSite = 0;
    this.site.forEach(function(s) {
      var objOnSite = this.map.getObject(s.x, s.y);
      if (objOnSite && objOnSite instanceof Sheep) {
        sheepsOnSite++;
      }
    }.bind(this));
    return sheepsOnSite;
  },

  _genState: function() {
    var visibleArea = [];
    var see = {};
    function toState(d) {
      var st = _.clone(d.toPlayerState());
      //anonimize :)
      if (!see[d.x + '_' + d.y]) {
        st = {
          voice: st.voice,
          x: st.x,
          y: st.y
        }
      }
      return st;
    }
    this.dogs.forEach(function(d) {
      this.map.getObjectsAround(d.x, d.y, this.o.dogVisibilityR).forEach(function(o) {
        if (!see[o.x + "_" + o.y]) {
          see[o.x + "_" + o.y] = true;
          visibleArea.push(o);
        }
      });
    }.bind(this));
    this.map.getObjectsBy('object').forEach(function(o) {
      if (o.type == "Dog" && o.isBarking && !see[o.x + '_' + o.y]) {
        visibleArea.push(o);
      }
    });
    return {
      turn: this.game.getTurn(),
      playerId: this.getId(),
      playersCount: this.game.getPlayers().length,
      landscape: this.game.toState().landscape,
      area: this.area,
      objects: visibleArea.map(toState)
    }
  },

  toState: function() {
    return this.savedState;
  },

  COMMANDS: ["move", "bark"],

  command: function(cmd, args, cb) {
    if (this.COMMANDS.indexOf(cmd) > -1) {
      this[cmd].apply(this, args.concat([cb]));
    }
    else {
      cb("Unknown command - " + cmd + ", only the following are allowed: " + this.COMMANDS.join(","));
    }
  },

  move: function(id, direction, cb) {

    var movement = constants.DIRECTIONS[direction];
    if (!movement) {
      return cb(id + " Unexpected direction '" + direction + "', one of the following expected: " + Object.keys(constants.DIRECTIONS).join(','));
    }
    var dog = this.dogById[id];
    if (!dog) return cb(id + " Unknown id");
    if (dog.moved) return cb(id + " Dog already moved this turn");
    dog.move(movement.dx, movement.dy, function(err) {
      if (err) {
        return cb(id + " " + err);
      }
      dog.moved = true;
      cb();
    });
  },

  bark: function(id, cb) {
    var dog = this.dogById[id];
    if (!dog) return cb(id + " Unknown id");
    if (dog.justBarked) return cb(id + " Dog with already barked this turn");
    dog.bark(function(err) {
      cb(err ? id + " " + err : err);
    });
  },

  endTurn: function(error) {
    this.moved = !error;
    this.game.emit(Game.Event.PlayerTurn, this, this.turn, error);
  },

  setController: function(controller) {
    this.controller = controller;
  },

  generateState: function() {
    this.savedState = this._genState();
  },

  makeTurn: function() {
    this.generateState();
    this.turn = this.game.getTurn();
    this.moved = false;
    this.dogs.forEach(function(d) {
      d.moved = false;
    });
    this.controller.sendTurn();
  },

  finished: function(gameResult) {
    this.controller.finished(gameResult.winner == this, gameResult);
  },

  isMoved: function() {
    return this.moved;
  },

  getGameOptions: function() {
    return this.o;
  },

  _onStop: function() {
    this.game = null;
    this.map = null;
    this.dogs = null;
    this.site = null;
    this.controller.close();
    this.controller = null;
  }


};

module.exports = PlayerInterface;
