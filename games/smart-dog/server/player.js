var Dog = require('./dog')
  , constants = require('./consts.js')
  , Sheep = require('./sheep.js')
  , Game = require('../../../core/server/game/game.js');

var PlayerInterface = function(game, ownerId, info, options) {
  this.game = game;
  this.o = options;
  this.id = ownerId;
  this.info = info;
  this.name = info.name;
  this.game.on(Game.Event.AfterTurn, this.generateState.bind(this));
};

var PlayerController = {
  init: function(playerInterface) {},
  sendTurn: function() {},
  finished: function(winner, gameResult) {}
};

PlayerInterface.prototype = {
  init: function() {
    this.map = this.game.getMap();
    //TODO: constants for layers
    this.dogs = this.map.getObjectsBy("object", function(o) {return o instanceof Dog && o.owner.id == this.id}.bind(this));
    this.site = this.map.getObjectsBy("landscape", function(o) {return o.type == "Site" && o.owner.id == this.id}.bind(this));
    this.dogById = {};
    for (var i = 0; i < this.dogs.length; i++) {
      this.dogById[this.dogs[i].id] = this.dogs[i];
    }
    this.savedState = this._genState();
    this.controller.init(this);
  },

  getName: function() {
    return this.name;
  },

  getId: function() {
    return this.id;
  },

  calculateScore: function() {
    var score = 0;
    if (!this.site) return score;
    this.site.forEach(function(s) {
      var objOnSite = this.map.getObject(s.x, s.y);
      if (objOnSite && objOnSite instanceof Sheep) {
        score++;
      }
    }.bind(this));
    return score;
  },

  _genState: function() {
    var visibleArea = [];
    var see = {};
    function toState(d) {
      var st = d.toState();
      //anonimize :)
      if (!see[d.x + '_' + d.y]) {
        var ost = st;
        st = {};
        Object.keys(ost).forEach(function(k) {
          if (['id', 'type', 'owner'].indexOf(k) > -1) return;
          st[k] = ost[k];
        })
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
      turn: this.game.turn,
      dogs: this.dogs.map(toState),
      visibleArea: visibleArea.map(toState),
      landscape: this.game.toState().landscape
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
      return cb("Unexpected direction '" + direction + "', one of the following expected: " + Object.keys(constants.DIRECTIONS).join(','));
    }
    var dog = this.dogById[id];
    if (!dog) return cb("Unknown id - " + id);
    if (dog.moved) return cb("Dog with id " + id + " already moved this turn");
    dog.move(movement.dx, movement.dy, function(err) {
      if (err) {
        return cb(err);
      }
      dog.moved = true;
      cb();
    });
  },

  bark: function(id, cb) {
    var dog = this.dogById[id];
    if (!dog) return cb("Unknown id - " + id);
    if (dog.justBarked) return cb("Dog with id " + id + " already barked this turn");
    dog.bark();
    cb();
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
  }


};

module.exports = PlayerInterface;
