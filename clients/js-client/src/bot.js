var common = require('./common')
  , AI = require('./ai');

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
    return common.Landscape.isTraversable(this.landscape[y][x]) && !this.objects[y][x];
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

  function nx(x) {
    if (x < 0 || x >= width) return (x + width) % width;
    return x;
  }

  function ny(y) {
    if (y < 0 || y >= height) return (y + height) % height;
    return y;
  }

  function search(visited, process, o, match) {
    if (match(o)) {
      return o;
    }
    visited[o.x+'_'+ o.y] = true;
    for (var dx = -1; dx <=1; dx++) {
      for (var dy = -1; dy <=1; dy++) {
        var nextO = {x:nx(o.x + dx), y:ny(o.y + dy)};
        if (!visited[nextO.x+'_'+ nextO.y]) {
          process.push(nextO);
          visited[nextO.x+'_'+ nextO.y] = true;
        }
      }
    }
    return null;
  }

  this.distance = function(o1, o2) {
    var dx = cdx(o1.x, o2.x);
    var dy = cdy(o1.y, o2.y);
    return Math.sqrt(dx*dx+dy*dy);
  };

  this.oppositeDirection = function(direction) {
    return common.Directions[direction].opposite;
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
      x: nx(o1.x + common.Directions[direction].dx),
      y: ny(o1.y + common.Directions[direction].dy)
    }
  };

  //Returns set of directions object at <c>from</c> shall move into to get <c>to</c>
  //This simple implementation returns only one direction
  this.findWay = function(from, to, ignore) {
    var direction = this.direction(from, to);
    var validDirections = [direction].concat(common.Directions[direction].alternatives)
      .filter(function(d) {
      var p = this.at(from, d);
      return this.isTraversable(p.x, p.y) && (!ignore || !ignore(p.x, p.y));
    }.bind(this));
    return validDirections.length > 0 ? validDirections.slice(0, 1) : [];

  };

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

  this.sortByDistance = function(o, objects) {
    if (objects.length == 0) return [];
    return objects
      .map(function(ob) {return {o: ob, distance: this.distance(o, ob)}}.bind(this))
      .sort(function(p1, p2) {return p1.distance - p2.distance})
      .map(function(p) {return p.o});
  };

  this.canBarkOn = function(dog, o) {
    return this.distance(dog, o) <= this.opt("dogBarkingR");
  };


  this.setObjects = function(objects) {
    this.objects = [];
    for (var i = 0; i < height; i++) {
      this.objects.push(new Array(width));
    }
    objects.forEach(function(o) {
      this.objects[o.y][o.x] = o;
    }.bind(this));
  };
  this.setObjects([]);
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
    this.landscape.setObjects(objects);
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
module.exports = {
  Landscape: Landscape,
  Bot: Bot
};