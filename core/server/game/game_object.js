var Moveable = require('./moveable.js');

var id = 1;

/**
 * Represents game object with base properties/functionality - coordinates, type, etc.
 * Update[Grishin]: I've removed internal private object and getters because they increases memory usage.
 *
 * See also:
 *  helper.js - helps traversing map
 *  moveable.js - example of module
 *
 * @param game
 * @param properties
 * @constructor
 */
function GameObject(game, properties) {
  this.p = {
    game: game,
    map: game.getMap(),
    id: id++,
    oldPosition: undefined,
    GameEvent: game.Event
  };

  Object.keys(properties).forEach(function(key) {
    this.p[key] = properties[key];
  }.bind(this));
  if (properties.landscape) return;

  this._extend(this.p);
  this._subscribe(this.p);
}

GameObject.Event = {
  Move: "gameobject.move"
};

GameObject.prototype = {

  get x() {
    return this.p.x;
  },

  get y() {
    return this.p.y;
  },

  get layer() {
    return this.p.layer;
  },

  get owner() {
    return this.p.owner;
  },

  get type() {
    return this.constructor.name;
  },

  get id() {
    return this.p.id;
  },

  locate: function(x,y) {
    this.p.x = x;
    this.p.y = y;
  },

  toState: function() {
    return this._genState(this.p);
  },

  toPlayerState: function() {
    return this._genPlayerState(this.p);
  },

  close: function() {
    this.p.game = null;
    this.p.map = null;
    this.p.$ = null;
  },

  _subscribe: function(p) {
    p.game.on(p.GameEvent.BeforeTurn, function() {
      p.oldPosition = undefined;
      this._beforeTurn(p);
    }.bind(this));
    p.game.on(p.GameEvent.AfterTurn, this._afterTurn.bind(this, p));
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
      state.movedDx = p.oldPosition.dx;
      state.movedDy = p.oldPosition.dy;
    }
    return state;
  },

  _genPlayerState: function(p) {
    return this._genState(p);
  },

  _extend: function(p) {
    //do nothing, extend it in subclasses
  },

  _beforeTurn: function(p) {

  },

  _afterTurn: function(p) {

  }
};

Moveable.extendClass(GameObject);
GameObject.id = function() {return id};
module.exports = GameObject;