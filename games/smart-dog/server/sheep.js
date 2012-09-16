var GameObject = require('../../../core/server/game/game_object.js')
  , util = require('util')
  , Dog = require('./dog')
  , constants = require('./consts.js');

function Sheep(game, properties) {
  GameObject.call(this, game, properties);
}

util.inherits(Sheep, GameObject);

var goRight = {
  dir: constants.RIGHT
};
var goUp = {
  dir: constants.UP
};
var goLeft = {
  dir: constants.LEFT
};
var goDown = {
  dir: constants.DOWN
};
goUp.next = [goLeft, goRight, goDown];
goLeft.next = [goDown, goUp, goRight];
goDown.next = [goRight, goLeft, goUp];
goRight.next = [goUp, goDown, goLeft];
[goDown,goUp,goLeft,goRight].forEach(function(g) {g.dx = constants.DIRECTIONS[g.dir].dx; g.dy = constants.DIRECTIONS[g.dir].dy; });

Sheep.prototype._genState = function(p) {
  var state = GameObject.prototype._genState.call(this, p);
  state.scary = p.fearSources.length > 0;
  state.direction = p.direction.dir;
  return state;
};

Sheep.prototype._extend = function(p) {
  p.fearSources = [];
  p.direction = goDown;
  p.standBy = p.sheepStandBy;
  p.sheepScaryDistance2 = p.sheepScaryDistance* p.sheepScaryDistance;
  p.game.on(Dog.Event.Barked, function(dog) {
    //TODO: also they shall be sent to players
    if (p.map.distance2(p.x, p.y, dog.x, dog.y) < p.sheepScaryDistance2) {
      p.fearSources.push({x: dog.x, y: dog.y, turns:p.sheepScaryTurns});
      p.standBy = 0;
    }
  })
};

Sheep.prototype._beforeTurn = function(p) {
  p.fearSources = p.fearSources.filter(function(fs) {
    return --fs.turns>0;
  });
  if (p.standBy > 0) p.standBy--;
};

Sheep.prototype._afterTurn = function(p) {
  //detect where to go next
  if (p.standBy > 0) return;  //just stay on the grass
  if (p.fearSources.length > 0) {
    //TODO: right now get the latest fear source
    var s = p.fearSources[p.fearSources.length-1];
    var direction = p.map.getDirection(s.x, s.y, p.x, p.y);
    p.direction = [goDown,goUp,goLeft,goRight].filter(function(go) {
      return go.dx == direction.dx && go.dy == direction.dy;
    })[0];
    //TODO: if cannot move this way - shall try another ones, but not forward to fear source
    console.log("Sheep " + p.id + " fears of dog at " + s.x + "," + s.y + " and going to run into " + direction.dx + "," + direction.dy);
    this.move(direction.dx, direction.dy, function(err) {
      if (err) console.log("Sheep stuck - " + err);
    });
  }
  else {
    function check(dr) {
      //TODO: it seems to a duplicate of code in GameObject.move. Lets move out
      var landscape = p.map.getLandscape(p.x+dr.dx, p.y+dr.dy);
      if (landscape.traversable) {
        var o = p.map.getObject(p.x+dr.dx, p.y+dr.dy);
        if (!o) {
          return true;
        }
      }
      return false;
    }
    if (!check(p.direction)) {
      var valid = p.direction.next.filter(function(d) {return check(d);});
      if (valid.length > 0) {
        p.direction = valid[0];
      }
    }
    if (check(p.direction)) {
      //TODO: add more selectors to map
      //make it look like:
      //  $ = map;
      //  $.objects.all
      //  $.all
      //  $.object.at(x,y)
      //  $.at(x,y).object
      //  $.objects.around(x,y,radius)
      //  $.landscape.forward(x,y,dx,dy,distance)
      //  $.objects.around(x,y,radius).find("Dog.isBarking")
      console.log("Sheep " + p.id + "  decided to go " + p.direction.dir);
      this.move(p.direction.dx, p.direction.dy, function(err){
        if (err) console.error("Shall never happen - " + err);
      });
      p.standBy = p.sheepStandBy;
    }
    else {
      console.log("Sheep " + p.id + "  decided to stay here");
    }
  }
};

module.exports = Sheep;

