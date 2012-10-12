var GameObject = require('../../../core/server/game/game_object.js')
  , util = require('util')
  , Dog = require('./dog')
  , constants = require('./consts.js')
  , _ = require('cloneextend');

/**
 * Represents sheep with its behavior
 * @constructor
 */
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
  DoMoveScaredSheeps: "sheep.doMoveScaredSheeps",
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
  GameObject.prototype._extend.call(this, p);
  p.sheepStandBy = parseInt(p.sheepStandBy);
  p.scaredBy = null;
  p.scared = 0;
  p.direction = goDown;
  p.fearChain = [];
  p.moved = false;
  var $ = p.game.$;
  p.game.on(Sheep.Event.DoMove, this._doMove.bind(this, p));
  p.game.on(Sheep.Event.DoMoveScaredSheeps, this._doMoveScaredSheeps.bind(this, p));
  p.game.on(Sheep.Event.DoFear, this._doFear.bind(this, p));
  p.game.on(Dog.Event.Barked, function(dog) {
    if ($(this).inRadius(dog, p.dogBarkingR)) {
      this._scare(p, dog, p.sheepScaryTurns);
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
  p.moved = false;
};

Sheep.prototype._scare = function(p, scaryObject, scaryTurns) {
  if (!scaryObject || (p.scaredBy && scaryObject instanceof Sheep)) return;
  var fearChain = (scaryObject.fearChain || []).slice().concat([scaryObject]);
  if (fearChain.indexOf(this) > -1) return;  //we do not fears which were scared by us :)
  p.scaredBy = scaryObject;
  p.fearChain = fearChain;
  p.scared = scaryTurns;
  p.direction = scaryObject.direction ? scaryObject.direction : getDirection(p.game.$(scaryObject).direction(this));
};

Sheep.prototype._shallMove = function(p) {
  var sheepStandsOn = p.map.getLandscape(p.x, p.y);
  if (sheepStandsOn.type == 'Site') return false;
  return p.game.getTurn() % (p.sheepStandBy+1) == p.sheepStandBy;
};

Sheep.prototype._step = function(p, dr, firstAttempt, cb) {
  if (cb == undefined) {
    cb = firstAttempt;
    firstAttempt = true;
  }
  var barrier = p.game.$.getBarrier(p.x+dr.dx, p.y+dr.dy);
  if (barrier) {
    if (barrier instanceof Sheep && firstAttempt) {
      console.log(" [ Let's sheep at " + barrier.x + "," + barrier.y + " moves first");
      barrier.doPreliminaryMove();
      console.log(" ]");
      //let it move first - if not moved
      this._step(p, dr, false, cb);
    }
    return cb("Cannot move sheep at " + p.x + "," + p.y + " to " + (p.x+dr.dx) + "," + (p.y+dr.dy) + ": there is " + barrier.type);
  }
  this.move(dr.dx, dr.dy, function(err) {
    if (err) return cb(err);
  });
  return cb();
};

Sheep.prototype.doPreliminaryMove = function() {
  if (this.p.inPreliminaryMove) return; //to prevent cycles
  this.p.inPreliminaryMove = true;
  this._doFear(this.p);
  this._doMove(this.p, true);
  this.p.inPreliminaryMove = false;
};

Sheep.prototype._doMoveScaredSheeps = function(p) {
  if (!p.scaredBy) return;
  this._doMove(p);
};
Sheep.prototype._doMove = function(p, preliminary) {
  if (p.moved) {
    //already moved
    return;
  }
  p.moved = !preliminary;
  if (p.scaredBy) {
    this._step(p, p.direction, function(err) {
      if (err) {
        console.log("Sheep stuck - " + err);
      }
      else {
        p.moved = true;
      }
    });
  }
  else {
    console.log("turn#" + p.game.getTurn() + ", sheep at " + p.x + "," + p.y + " s=" + p.game.getTurn() % (1+p.sheepStandBy), " sm = " + this._shallMove(p));
    if (!this._shallMove(p)) return;
    var found = false;
    [p.direction].concat(p.direction.next).forEach(function(dr) {
      if (found) return;
      this._step(p, dr, function(err) {
        if (!err) {
          found = true;
          p.direction = dr;
          p.moved = true;
          console.log("Sheep moved to " + p.x + "," + p.y )
        }
        else {
          console.log(err);
        }
      });
    }.bind(this));
  }

};

Sheep.prototype._doFear = function(p) {
  var $ = p.game.$;
  if (!$) {
    console.error("$ is undefined");
    return;
  }
  var sheep = $(this).around(1.5).find(".Sheep :scared").not(this).first();
  this._scare(p, sheep, p.sheepScaryTurns);
};

Sheep.prototype.__defineGetter__('scared', function() {return this.p.scaredBy != null;});
Sheep.prototype.__defineGetter__('direction', function() {return this.p.direction});
Sheep.prototype.__defineGetter__('fearChain', function() {return this.p.fearChain});


module.exports = Sheep;

