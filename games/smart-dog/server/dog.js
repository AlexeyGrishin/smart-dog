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
  if (p.barking) state.voice = "barking";
  return state;
};

Dog.prototype._extend = function(p) {
  p.barking = false;
  p.justBarked = false;
  this.__defineGetter__('isBarking', function() {return p.barking;});
  this.bark = function() {
    p.justBarked = true;
    p.barking = true;
    p.game.emit(Dog.Event.Barked, this);
  }
};

Dog.prototype._afterTurn = function(p) {
  p.barking = p.justBarked;
  p.justBarked = false;
};

module.exports = Dog;

