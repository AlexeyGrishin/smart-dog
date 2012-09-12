var id = 1;

function GameObject(game, properties) {
  var p = {
    game: game,
    map: game.getMap(),
    id: id++,
    oldPosition: undefined
  };

  Object.keys(properties).forEach(function(key) {
    p[key] = properties[key];
  });
  this.__defineGetter__('layer', function() {
    return p.layer;
  });
  this.__defineGetter__('owner', function() {
    return p.owner;
  });
  this.__defineGetter__('x', function() {
    return p.x;
  });
  this.__defineGetter__('y', function() {
    return p.y;
  });
  this.__defineGetter__('id', function() {
    return p.id;
  });
  this.locate = function(x,y) {
    p.x = x;
    p.y = y;
  };
  this.toState = function() {
    return this.genState(p);
  };
  this.move = function(dx, dy, cb) {
    dx = parseInt(dx);
    dy = parseInt(dy);
    var landscape = p.map.getLandscape(p.x + dx, p.y + dy);
    if (!landscape.traversable)
      return cb("Cannot move " + dx + "," + dy + " - landscape is not traversable: " + landscape.type);
    var object = p.map.getObject(p.x + dx, p.y + dy);
    if (object != undefined)
      return cb("Cannot move " + dx + "," + dy + " - there is a object: " + object.type);
    var oldX = p.x, oldY = p.y;
    p.x = p.map.x(p.x + dx);
    p.y = p.map.y(p.y + dy);
    game.emit("gameobject.move", this, oldX, oldY);
    p.oldPosition = {
      x: oldX,
      y: oldY
    };
    cb();
  };
  this.__defineGetter__('type', function() { return this.constructor.name});
  this.extend(p);
  var Game = require('./game.js');
  game.on(Game.Event.BeforeTurn, this.beforeTurn.bind(this, p));
  game.on(Game.Event.AfterTurn, this.afterTurn.bind(this, p));
}

GameObject.Event = {
  Move: "gameobject.move"
};

GameObject.prototype = {
  finalize: function() {
    //do nothing
  },

  genState: function(p) {
    var state = {
      owner:p.owner ? p.owner.getId() : undefined,
      type: this.type,
      x:p.x,
      y:p.y,
      layer:p.layer
    };
    if (p.oldPosition) {
      state.movedFromX = p.oldPosition.x;
      state.movedFromY = p.oldPosition.y;
    }
    return state;
  },

  extend: function(p) {
    //do nothing, extend it in subclasses
  },

  beforeTurn: function(p) {
    p.oldPosition = undefined;
  },

  afterTurn: function(p) {

  }
};

module.exports = GameObject;