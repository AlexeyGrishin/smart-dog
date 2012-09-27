var GameObject = require('../../../core/server/game/game_object.js')
  , util = require('util')
  , Dog = require('./dog')
  , constants = require('./consts.js')
  , _ = require('cloneextend');

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

function getDirection(direction) {
  return [goDown,goUp,goLeft,goRight].filter(function(go) {
    return go.dx == direction.dx && go.dy == direction.dy;
  })[0];
}

Sheep.Event = {
  SheepScared: "sheep.scared",
  DoMove: "sheep.doMove",
  DoFear: "sheep.doFear"
};

Sheep.prototype._genState = function(p) {
  var state = _.extend(GameObject.prototype._genState.call(this, p), this._genPlayerState(p));
  if (p.scaredBy) {
    state.scaredBy = {x: p.scaredBy.x, y:p.scaredBy.y};
    state.scared = p.scared;
  }
  return state;
};

Sheep.prototype._genPlayerState = function(p) {
  return {
    type: this.type,
    x:p.x,
    y:p.y,
    action: p.scared ? "panic" : (this._shallMove(p) ? "move" : "standBy"),
    direction:p.direction.dir
  }
};

Sheep.prototype._extend = function(p) {
  p.sheepStandBy = parseInt(p.sheepStandBy);
  p.scaredBy = null;
  p.scared = 0;
  p.direction = goDown;
  p.fearChain = [];
  this.__defineGetter__('scared', function() {return p.scaredBy != null;});
  this.__defineGetter__('direction', function() {return p.direction});
  this.__defineGetter__('fearChain', function() {return p.fearChain});
  var $ = p.game.$;
  p.game.on(Sheep.Event.DoMove, this._doMove.bind(this, p));
  p.game.on(Sheep.Event.DoFear, this._doFear.bind(this, p));
  p.game.on(Dog.Event.Barked, function(dog) {
    if ($(this).inRadius(dog, p.dogBarkingR)) {
      this._scare(p, dog);
    }
  }.bind(this));

};

Sheep.prototype._beforeTurn = function(p) {
  if (p.scaredBy) {
    p.scared--;
    if (p.scared <= 0) {
      p.scaredBy = null;
      p.fearChain = [];
    }
  }
};

Sheep.prototype._scare = function(p, scaryObject) {
  if (!scaryObject || (p.scaredBy && scaryObject instanceof Sheep)) return;
  var fearChain = (scaryObject.fearChain || []).slice().concat([scaryObject]);
  if (fearChain.indexOf(this) > -1) return;  //we do not fears which were scared by us :)
  p.scaredBy = scaryObject;
  p.fearChain = fearChain;
  p.scared = p.sheepScaryTurns;
  p.direction = scaryObject.direction ? scaryObject.direction : getDirection(p.game.$(scaryObject).direction(this));
};

Sheep.prototype._shallMove = function(p) {
  return p.game.getTurn() % (p.sheepStandBy+1) == p.sheepStandBy;
};

Sheep.prototype._doMove = function(p) {
  if (p.scaredBy) {
    //console.log("Sheep " + p.id + " fears " + p.scaredBy.type + " at " + p.scaredBy.x + "," + p.scaredBy.y + " and going to run into " + p.direction.dx + "," + p.direction.dy);
    this.move(p.direction.dx, p.direction.dy, function(err) {
      //if (err) console.log("Sheep stuck - " + err);
    });
  }
  else {
    //console.log("turn#" + p.game.getTurn() + ", s=" + p.game.getTurn() % (1+p.sheepStandBy), " sm = " + this._shallMove(p));
    if (!this._shallMove(p)) return;
    var $ = p.game.$;
    function check(dr) {
      return ($.canMoveTo(p.x+dr.dx, p.y+dr.dy));
    }
    if (!check(p.direction)) {
      var valid = p.direction.next.filter(function(d) {return check(d);});
      if (valid.length > 0) {
        p.direction = valid[0];
      }
    }
    if (check(p.direction)) {
      //console.log("Sheep " + p.id + "  decided to go " + p.direction.dir);
      this.move(p.direction.dx, p.direction.dy, function(err){
        if (err) console.error("Shall never happen - " + err);
      });
    }
    else {
      console.log("Sheep " + p.id + "  decided to stay here");
    }
  }

};

Sheep.prototype._doFear = function(p) {
  var $ = p.game.$;
  var sheep = $(this).around(1.5).find(".Sheep :scared").not(this).first();
  this._scare(p, sheep);
};

module.exports = Sheep;

