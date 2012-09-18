var GameObject = require('../../../core/server/game/game_object.js')
  , util = require('util')
  , Game = require('../../../core/server/game/game.js');

function Dog(game, properties) {
  GameObject.call(this, game, properties);
}
Dog.Event = {
  Barked: 'dog.barked'
};

util.inherits(Dog, GameObject);

Dog.prototype._genState = function(p) {
  var state = GameObject.prototype._genState.call(this, p);
  state.id = p.id;
  //TODO: probably separate state for views/replays (complete) and for controllers (reduced)
  state.sheepBarkingRadius = p.sheepScaryDistance;
  state.dogBarkingRadius = p.sheepScaryDistance;
  state.sheepBarkingArea = p.map.getArea(p.x, p.y, p.sheepScaryDistance);
  state.scary = p.scary > 0;
  state.silence = p.silence;
  if (p.scaredBy) {
    state.scaredBy = p.scaredBy;
  }
  if (p.barking) state.voice = "barking";
  return state;
};

Dog.prototype._extend = function(p) {
  p.barking = false;
  p.justBarked = false;
  p.scary = 0;
  p.justBecameScary = false;
  p.silence = 0;
  this.__defineGetter__('isBarking', function() {return p.barking;});
  this.__defineGetter__('justBarked', function() {return p.justBarked;});
  this.__defineGetter__('justBecameScary', function() {return p.justBecameScary;});
  this.__defineGetter__('scary', function() {return p.scary > 0;});
  this.bark = function(cb) {
    if (p.silence) return cb("Cannot bark because fighted by another dog");
    p.justBarked = true;
    p.barking = true;
    p.game.emit(Dog.Event.Barked, this);
    cb();
  };
  p.game.on(Dog.Event.Barked, function(barkedDog) {
    if (barkedDog.owner == p.owner) return; //we do not fear our dogs
    //TODO: test distance detection, add debug rendering
    var fearDistance = p.map.getLandscape(p.x, p.y).owner == barkedDog.owner ? p.dogHomeScaryDistance : p.dogScaryDistance;
    if (p.map.distance2(p.x, p.y, barkedDog.x, barkedDog.y) <= fearDistance*fearDistance) {
      p.justBecameScary = true;
      p.scaredBy = {x: barkedDog.x, y: barkedDog.y};
    }
  });

  var oldMove = this.move;
  this.move = function(dx, dy, cb) {
    if (this.scary) return cb("Cannot move - scary :(");
    oldMove.call(this, dx, dy, cb);
  }
};

Dog.prototype._beforeTurn = function(p) {
};

Dog.prototype._afterTurn = function(p) {
  if (p.scary) p.scary--;
  if (p.silence) p.silence--;
  p.barking = p.justBarked;
  p.justBarked = false;
  if (p.justBecameScary) {
    p.scary = p.dogScaryTurns;
    p.silence = p.dogSilenceTurns;
    p.justBecameScary = false;
  }
};

module.exports = Dog;

