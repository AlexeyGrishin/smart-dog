var GameObject = require('../../../core/server/game/game_object.js')
  , util = require('util');

function Dog(game, properties) {
  GameObject.call(this, game, properties);
};

util.inherits(Dog, GameObject);

Dog.prototype.genState = function(p) {
  var state = GameObject.prototype.genState.call(this, p);
  state.id = p.id;
  state.barking = false;
  return state;
};
module.exports = Dog;

