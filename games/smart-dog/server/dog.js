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
  state.sheepBarkingRadius = p.dogBarkingR;
  state.dogBarkingRadius = p.dogBarkingR;
  state.sheepBarkingArea = p.map.getArea(p.x, p.y, p.dogBarkingR);
  state.scared = p.scared > 0;
  state.action = p.scared ? (p.onlySilence ? "indignant" : "panic") : "move";
  if (p.scaredBy) {
    state.scaredBy = p.scaredBy;
  }
  if (p.barking) state.voice = "barking";
  return state;
};

Dog.prototype._extend = function(p) {
  p.barking = false;
  p.justBarked = false;
  p.scared = 0;
  p.justBecameScared = false;
  p.onlySilence = false;
  p.dogBarkingR2 = p.dogBarkingR* p.dogBarkingR;
  this.__defineGetter__('isBarking', function() {return p.barking;});
  this.__defineGetter__('justBarked', function() {return p.justBarked;});
  this.__defineGetter__('justBecameScared', function() {return p.justBecameScared;});
  this.__defineGetter__('scared', function() {return p.scared > 0;});
  this.bark = function(cb) {
    if (p.scared) return cb("Cannot bark because fighted by another dog");
    p.justBarked = true;
    p.barking = true;
    p.game.emit(Dog.Event.Barked, this);
    cb();
  };
  p.game.on(Dog.Event.Barked, function(barkedDog) {
    if (barkedDog.owner == p.owner) return; //we do not fear our dogs
    var enemyOnOurArea = p.map.getLandscape(barkedDog.x, barkedDog.y).owner == p.owner;
    if (p.game.$(this).inRadius(barkedDog, p.dogBarkingR)) {
      console.log("Scared by dog at " + barkedDog.x + ", " + barkedDog.y + ", it is on our area: " + enemyOnOurArea);
      p.justBecameScared = true;
      p.scaredBy = {x: barkedDog.x, y: barkedDog.y};
      p.onlySilence = enemyOnOurArea;
    }
  }.bind(this));

  var oldMove = this.move;
  this.move = function(dx, dy, cb) {
    if (this.scared && !p.onlySilence) return cb("Cannot move - scared :(");
    oldMove.call(this, dx, dy, cb);
  }
};

Dog.prototype._beforeTurn = function(p) {
};

Dog.prototype._afterTurn = function(p) {
  if (p.scared) p.scared--;
  if (p.silence) p.silence--;
  p.barking = p.justBarked;
  p.justBarked = false;
  if (p.justBecameScared) {
    p.scared = p.dogScaryTurns;
    p.justBecameScared = false;
  }
};

module.exports = Dog;

