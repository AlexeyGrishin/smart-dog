var common = require('./common');

function Landscape(landscape, options) {
  this.landscape = landscape;
  var height = options.rows, width = options.cols, halfWidth = Math.ceil(width/2), halfHeight = Math.ceil(height/2);
  this.get = function(x, y) {
    return this.landscape[y][x];
  };
  this.opt = function(opt) {
    return options[opt];
  };
  this.is = function(x, y, type) {
    return this.landscape[y][x] == type;
  };
  this.isTraversable = function(x, y) {
    return common.Landscape.isTraversable(this.landscape[y][x]);
  };
  this.isMySite = function(x, y) {
    return this.landscape[y][x] == options.you+"";
  };
  this.isEnemySite = function(x, y) {
    return common.Landscape.isSite(this.landscape[y][x]) && !this.isMySite(x, y);
  };
  function cdx(x1, x2) {
    var dx = x2 - x1;
    if (dx < -halfHeight) dx = width + dx;
    if (dx > halfWidth) dx = dx - width;
    return dx;
  }
  function cdy(y1, y2) {
    var dy = y2 - y1;
    if (dy <= -halfHeight) dy = height + dy;
    if (dy >= halfHeight) dy = dy - height;
    return dy;
  }
  this.distance = function(o1, o2) {
    var dx = cdx(o1.x, o2.x);
    var dy = cdy(o1.y, o2.y);
    return Math.sqrt(dx*dx+dy*dy);
  };
  this.oppositeDirection = function(direction) {
    return {"left": "right", "up": "down", "right": "left", "down": "up"}[direction];
  };
  this.direction = function(o1, o2) {
    var dx = cdx(o1.x, o2.x);
    var dy = cdy(o1.y, o2.y);
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx < 0 ? "left": "right";
    }
    return dy < 0 ? "up" : "down";
  };
  this.at = function(o1, direction) {
    return {
      x: o1.x + {left:-1, right:1, down:0, up:0}[direction],
      y: o1.y + {left:0, right:0, down:1, up:-1}[direction]
    }
  };
  function search(visited, process, o, match) {
    if (match(o)) {
      return o;
    }
    visited[o.x+'_'+ o.y] = true;
    for (var dx = -1; dx <=1; dx++) {
      for (var dy = -1; dy <=1; dy++) {
        var nextO = {x:o.x + dx, y:o.y + dy};
        if (nextO.x < 0 || nextO.x >= width) nextO.x = (nextO.x + width) % width;
        if (nextO.y < 0 || nextO.y >= height) nextO.y = (nextO.y + height) % height;
        if (!visited[nextO.x+'_'+ nextO.y]) {
          process.push(nextO);
          visited[nextO.x+'_'+ nextO.y] = true;
        }
      }
    }
    return null;
  }
  this.findNearest = function(o, match) {
    var visited = {};
    var process = [o];
    while (process.length > 0) {
      var result = search(visited, process, process.shift(), match);
      if (result) return result;
    }
    return null;
  };
  this.findNearestObject = function(o, objects) {
    if (objects.length == 0) return undefined;
    return objects
      .map(function(ob) {return {o: ob, distance: this.distance(o, ob)}}.bind(this))
      .sort(function(p1, p2) {return p1.distance - p2.distance})
      [0].o;
  };
  this.canBarkOn = function(dog, o) {
    return this.distance(dog, o) <= this.opt("dogBarkingR");
  }
}

var Bot = function(client) {
  client.on('init', function(options) {
    this.options = options;
    this.me = options.you;
  }.bind(this));
  client.on('landscape', function(landscape) {
    this.landscape = new Landscape(landscape, this.options);
  }.bind(this));
  client.on('turn', function(objects) {
    var dogs=[], sheeps=[], enemyDogs=[], barkingInvisible=[];
    var me = this.me;
    objects.forEach(function(o) {
      switch (o.type || 'Unknown') {
        case 'Dog':
          o.move = this.move.bind(this, o);
          o.bark = this.bark.bind(this, o);
          (o.owner == me ? dogs : enemyDogs).push(o);
          break;
        case 'Sheep':
          sheeps.push(o);
          break;
        case 'Unknown':
          barkingInvisible.push(o);
          break;
      }
    }.bind(this));
    AI.turn(dogs.sort(function(d1, d2) {return d1.id - d2.id}), sheeps, enemyDogs, barkingInvisible, this.landscape);
    this.client.end();
  }.bind(this));
  this.client = client;
};

Bot.prototype = {
  move: function(dog, direction) {
    this.client.do(dog.id || id, "move", direction);
  },

  bark: function(dog) {
    this.client.do(dog.id || id, "bark");
  }

};


var AI = {
  turn: function(dogs, sheeps, enemyDogs, barkingInvisible, landscape) {
    this.sheepDog(dogs.shift(), sheeps, landscape);
    dogs.forEach(function(d) { this.attackingDog(d, sheeps, enemyDogs.concat(barkingInvisible), landscape)}.bind(this));
  },

  sheepDog: function (dog, sheeps, landscape) {
    var sheepsNonOnPlace = sheeps.filter(function(s) { return !landscape.isMySite(s.x, s.y) });
    if (sheepsNonOnPlace.length > 0) {
      var nearestSheep = landscape.findNearestObject(dog, sheepsNonOnPlace);
      var nearestSite = landscape.findNearest(nearestSheep, function(l){
        return landscape.isMySite(l.x, l.y)
      });
      var requiredDirection = landscape.direction(nearestSheep, nearestSite);
      var barkingDirection = landscape.direction(dog, nearestSheep);
      if (barkingDirection == requiredDirection && landscape.canBarkOn(dog, nearestSheep)) {
        dog.bark();
      }
      else {
        var requiredLocationToBark = landscape.at(nearestSheep, landscape.oppositeDirection(requiredDirection));
        var direction = landscape.direction(dog, requiredLocationToBark);
        dog.move(direction);
      }
    }
  },

  attackingDog: function (dog, sheeps, enemyDogs, landscape) {
    var sheepsOnEnemySite = sheeps.filter(function(s) {return landscape.isEnemySite(s.x, s.y)});
    var shallBark = sheepsOnEnemySite.some(landscape.canBarkOn.bind(landscape, dog));
    if (!shallBark) {
      shallBark = enemyDogs.some(landscape.canBarkOn.bind(landscape, dog));
    }
    if (shallBark) dog.bark();
    var nearestTarget = landscape.findNearestObject(dog, sheepsOnEnemySite.concat(enemyDogs));
    var direction = nearestTarget ? landscape.direction(dog, nearestTarget) : "right";
    dog.move(direction);
  }

};



module.exports = {
  AI: AI,
  Landscape: Landscape,
  Bot: Bot
};
