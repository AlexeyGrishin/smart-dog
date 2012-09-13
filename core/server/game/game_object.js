var id = 1;

/**
 * Represents game object with base properties/functionality - coordinates, type, etc.
 * Note that it has private object which cannot be accessed outside
 *
 * TODO: in the future it seems to be useful to have modules that may be attached to GameObject, i.e.
 *
 * function Bullet() {
 * }
 * util.extend(Bullet, GameObject);
 * Bullet.make(Moveable); //adds 'move' method
 * Bullet.make(Solid);    //adds size and collisions
 *
 * @param game
 * @param properties
 * @constructor
 */
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
    return this._genState(p);
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
  this._extend(p);
  this._subscribe(p);
}

GameObject.Event = {
  Move: "gameobject.move"
};

GameObject.prototype = {
  finalize: function() {
    //do nothing
  },

  _subscribe: function(p) {
    var Game = require('./game.js');
    p.game.on(Game.Event.BeforeTurn, function() {
      p.oldPosition = undefined;
      this._beforeTurn(p);
    }.bind(this));
    p.game.on(Game.Event.AfterTurn, this._afterTurn.bind(this, p));
  },

  _genState: function(p) {
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

  _extend: function(p) {
    //do nothing, extend it in subclasses
  },

  _beforeTurn: function(p) {

  },

  _afterTurn: function(p) {

  }
};

module.exports = GameObject;