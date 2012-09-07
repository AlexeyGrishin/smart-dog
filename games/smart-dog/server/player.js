var Dog = require('./dog');

var PlayerInterface = function(game, ownerId, info, options) {
  this.game = game;
  this.o = options;
  this.id = ownerId;
  this.info = info;
  this.name = info.name;
};

var PlayerController = {
  init: function(playerInterface) {},
  sendTurn: function() {},
  finished: function(winner, gameResult) {}
};

PlayerInterface.prototype = {
  init: function() {
    this.map = this.game.getMap();  //TODO: use setters/getters instead
    //TODO: constants for layers
    this.dogs = this.map.getObjectsBy("object", function(o) {return o instanceof Dog && o.owner.id == this.id}.bind(this));
    this.dogById = {};
    for (var i = 0; i < this.dogs.length; i++) {
      this.dogById[this.dogs[i].id] = this.dogs[i];
    }
    this.savedState = this.genState();
    this.controller.init(this);
  },

  getName: function() {
    return this.name;
  },

  getId: function() {
    return this.id;
  },

  genState: function() {
    function toState(d) {
      return d.toState();
    }
    var visibleArea = [];
    var visited = {};
    this.dogs.forEach(function(d) {
      this.map.getObjectsAround(d.x, d.y, this.o.visibilityRadius).forEach(function(o) {
        if (!visited[o.x + "_" + o.y]) {
          visited[o.x + "_" + o.y] = true;
          visibleArea.push(o);
        }
      });
    }.bind(this));
    //TODO: also add barking dogs - all hear them
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

  COMMANDS: ["move"],

  command: function(cmd, args, cb) {
    if (this.COMMANDS.indexOf(cmd) > -1) {
      this[cmd].apply(this, args.concat([cb]));
    }
    else {
      cb("Unknown command - " + cmd + ", only the following are allowed: " + this.COMMANDS.join(","));
    }
  },

  DIRECTIONS: {
    up: {dx: 0, dy: -1},
    down: {dx: 0, dy: 1},
    left: {dx: -1, dy: 0},
    right: {dx: 1, dy: 0}
  },

  move: function(id, direction, cb) {

    var movement = this.DIRECTIONS[direction];
    if (!movement) {
      return cb("Unexpected direction '" + direction + "', one of the following expected: " + Object.keys(this.DIRECTIONS).join(','));
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

  endTurn: function(error) {
    this.moved = !error;
    this.game.emit('player.turn', this, this.turn, error);
  },

  setController: function(controller) {
    this.controller = controller;
  },

  makeTurn: function() {
    this.savedState = this.genState();
    this.turn = this.game.turn;
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
  }


};

module.exports = PlayerInterface;
