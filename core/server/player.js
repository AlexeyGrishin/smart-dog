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
  makeTurn: function() {},
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
    //TODO: send landscape once
    this.controller.init(this);
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
    return {
      turn: this.game.turn,
      dogs: this.dogs.map(toState),
      visibleArea: visibleArea.map(toState)
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

  move: function(id, dx, dy, cb) {
    var movement = Math.abs(dx) + Math.abs(dy);
    if (movement <= 0 && movement >= 2) {
      return cb("Cannot move by " + dx + "," + dy)
    }
    var dog = this.dogById[id];
    if (!dog) return cb("Unknown id - " + id);
    if (dog.moved) return cb("Dog with id " + id + " already moved this turn");
    dog.move(dx, dy, function(err) {
      if (err) {
       cb(err);
       cb = function() {};
      }
    });
    dog.moved = true;
    cb();
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
    this.controller.makeTurn();
  },

  finished: function(gameResult) {
    this.controller.finished(gameResult.winner == this, gameResult);
  },

  isMoved: function() {
    return this.moved;
  }


};

module.exports = PlayerInterface;
