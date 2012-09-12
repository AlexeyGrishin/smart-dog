var GameObject = require('../../../core/server/game/game_object.js')
  , util = require('util')
  , Dog = require('./dog')
  , constants = require('./consts.js');

function Sheep(game, properties) {
  GameObject.call(this, game, properties);
};

util.inherits(Sheep, GameObject);

Sheep.prototype.genState = function(p) {
  var state = GameObject.prototype.genState.call(this, p);
  state.scary = p.fearSources.length > 0;
  return state;
};

Sheep.prototype.extend = function(p) {
  p.fearSources = [];
  p.standBy = Math.ceil(Math.random()*4);
  p.game.on(Dog.Event.Barked, function(dog) {
    if (p.map.distance2(p.x, p.y, dog.x, dog.y) < 16) {
      p.fearSources.push({x: dog.x, y: dog.y, turns: 3});
      p.standBy = 0;
    }
  })
};

Sheep.prototype.beforeTurn = function(p) {
  p.fearSources = p.fearSources.filter(function(fs) {
    return --fs.turns>0;
  });
  if (p.standBy > 0) p.standBy--;
};

Sheep.prototype.afterTurn = function(p) {
  //detect where to go next
  if (p.standBy > 0) return;  //just stay on the grass
  if (p.fearSources.length > 0) {
    //TODO: right now get the latest fear source
    var s = p.fearSources[p.fearSources.length-1];
    var direction = p.map.getDirection(s.x, s.y, p.x, p.y);
    console.log("Sheep " + p.id + " fears of dog at " + s.x + "," + s.y + " and going to run into " + direction.dx + "," + direction.dy);
    this.move(direction.dx, direction.dy, function(err) {
      if (err) console.log("Sheep stuck - " + err);
    });
  }
  else {
    var doMove = undefined;
    Object.keys(constants.DIRECTIONS).forEach(function(drName) {
      var dr = constants.DIRECTIONS[drName];
      if (doMove) return;
      //TODO: it seems to a duplicate of code in GameObject.move. Lets move out
      var landscape = p.map.getLandscape(p.x+dr.dx, p.y+dr.dy);
      if (landscape.traversable) {
        var o = p.map.getObject(p.x+dr.dx, p.y+dr.dy);
        if (!o) {
          doMove = dr;
          return;
        }
      }
    });
    if (doMove) {
      console.log("Sheep " + p.id + "  decided to go " + doMove.dx + "," + doMove.dy);
      this.move(doMove.dx, doMove.dy, function(err){
        console.error("Shall never happen - " + err);
      });
      p.standBy = 4;
    }
    else {
      console.log("Sheep " + p.id + "  decided to stay here");
    }
  }
};

module.exports = Sheep;

