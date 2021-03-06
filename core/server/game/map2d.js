
function sign(num) {
  if (num > 0) return 1;
  if (num < 1) return -1;
  return 0;
}

/**
 * Represents 2d rectangle map with 1 or several layers where game objects may be contained.
 * Provides helpers for finding objects and calculating reltions between them.
 *
 * @param layers
 * @constructor
 */
var Map2D = function(layers) {
  this._ = {}
  this._.objects = {};
  this._.map = [];
  this._.layers = layers || ["landscape", "object"];
  this.__defineGetter__('cols', function() {return this._.width});
  this.__defineGetter__('rows', function() {return this._.height});
  this.__defineGetter__('allObjects', function() {return this._.objects["all"]});
  this._.layers.forEach(function(l) {
    var layoutName = l.substring(0,1).toUpperCase() + l.substring(1);
    this["get" + layoutName] = function(x, y) {
      return this.get(l, x, y);
    };
    this["remove" + layoutName] = function(x, y) {
      return this.remove(l, x, y);
    };
    this["add" + layoutName] = function(object, x, y) {
      return this.add(l, object, x, y);
    };
    this["get" + layoutName + "sAround"] = function(x, y, radius) {
      return this.getAround(l, x, y, radius);
    }
  }.bind(this))

};

const ALL = "all";

Map2D.prototype = {
  setSize: function(height, width) {
    this._.map = new Array(height);
    for (var i = 0; i < height; i++) {
      this._.map[i] = new Array(width);
    }
    this._.width = width;
    this._.height = height;
  },

  _putOnMap: function(layer, object, x, y) {
    var _ = this._;
    var obj = _.map[y][x] || {};
    if (obj[layer] !== undefined) {
      console.log(">>>");
      console.log(obj[layer].type);
      throw new Error('There is already object on layer "' + layer + '" x=' + x + ', y=' + y);
    }
    obj[layer] = object;
    _.map[y][x] = obj;
  },

  add: function(layer, object, x, y) {
    var _ = this._;
    this._putOnMap(layer, object, x, y);
    if (!_.objects[layer])
      _.objects[layer] = [];
    if (!_.objects[ALL])
      _.objects[ALL] = [];
    _.objects[layer].push(object);
    _.objects[ALL].push(object);
    object.locate(x, y);
    //TODO: special landscape map - for quick access
  },

  remove: function(layer, x, y) {
    var obj;
    if (typeof layer == 'object') {
      obj = layer;
      layer = obj.layer;
      x = obj.x;
      y = obj.y;
    }
    else {
      obj = this._.map[y][x][layer];
    }
    if (obj != undefined) {
      delete this._.map[y][x][layer];
      this._.objects[layer].splice(this._.objects[layer].indexOf(obj), 1);
      this._.objects[ALL].splice(this._.objects[ALL].indexOf(obj), 1);
      return obj;
    }
    return undefined;
  },

  get: function(layer, x, y) {
    return this._.map[this.y(y)][this.x(x)][layer];
  },

  getAllAt: function(x, y) {
    return this._.layers.map(function(l) {
      return this.get(l, x, y);
    }.bind(this)).filter(function(o) {return o != undefined});
  },

  getAll: function(layer) {
    if (!layer) layer = ALL;
    return this._.objects[layer];
  },

  objectMoved: function(object, oldX, oldY) {
    delete this._.map[oldY][oldX][object.layer];
    this._putOnMap(object.layer, object, this.x(object.x), this.y(object.y));

  },

  x: function(x) {
    x = Math.ceil(x);
    while (x < 0) {
      x += this.cols;
    }
    return x % this.cols;
  },

  y: function(y) {
    y = Math.ceil(y);
    while (y < 0) {
      y += this.rows;
    }
    return y % this.rows;
  },

  //here selectors
  distance2: function(x1, y1, x2, y2) {
    var delta = this.getDelta(x1,y1,x2,y2);
    return delta.dx*delta.dx + delta.dy*delta.dy;
  },

  //returns step as object {dx,dy} the object at x1,y1 shall perform to get x2,y2.
  //|dx| <=1 && |dy| <=1 && |dx|+|dy| <=1
  getDirection: function(x1, y1, x2, y2) {
    var delta = this.getDelta(x1, y1, x2, y2);
    var dir = {dx: sign(delta.dx), dy: sign(delta.dy)};
    if (dir.dx != 0 && dir.dy != 0) {
      if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
        dir.dy = 0;
      }
      else {
        dir.dx = 0;
      }
    }
    return dir;
  },

  //returns {dx,dy} the object at x1,y1 shall perform to get x2,y2
  getDelta: function(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dx2 = x2 > x1 ? -(x1 + this.cols - x2) : x2 + this.cols - x1;
    var dy = y2 - y1;
    var dy2 = y2 > y1 ? -(y1 + this.rows - y2) : y2 + this.rows - y1;
    dx = Math.abs(dx) < Math.abs(dx2) ? dx : dx2;
    dy = Math.abs(dy) < Math.abs(dy2) ? dy : dy2;
    return {dx: dx, dy: dy};
  },


  getAround: function(layer, x, y, radius) {
    var objects = [];
    this.getArea(x, y, radius).forEach(function(point) {
      var layers = this._.map[point.y][point.x];
      if (layer == ALL) {
        this._.layers.forEach(function(l) {
          if (layers == undefined)
            console.log(1);
          if (layers[l]) objects.push(layers[l]);
        });
      }
      else if (layers[layer])
        objects.push(layers[layer]);
    }.bind(this));
    return objects;
  },

  getArea: function(x, y, radius) {
    var radius2 = radius*radius;
    var area = [];
    for (var dx = -radius; dx <= radius; dx++) {
      for (var dy = -radius; dy <= radius; dy++) {
        var newX = this.x(x+dx);
        var newY = this.y(y+dy);
        if (this.distance2(x, y, newX, newY) <= radius2) {
          area.push({x:newX, y:newY});
        }
      }
    }
    return area;
  },

  getObjectsBy: function(layer, filter) {
    if (filter === undefined) {
      if (typeof layer == 'function') {
        filter = layer;
        layer = ALL;
      }
    }
    var os = this._.objects[layer] || [];
    if (filter) os = os.filter(filter);
    return os;
  }
};

module.exports = Map2D;