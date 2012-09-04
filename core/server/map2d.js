

var Map2D = function(layers) {
  this.objects = {};
  this.map = [];
  this.layers = layers || ["landscape", "object"];
  this.__defineGetter__('cols', function() {return this.width});
  this.__defineGetter__('rows', function() {return this.height});
  this.__defineGetter__('allObjects', function() {return this.objects["all"]});
  this.layers.forEach(function(l) {
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
  }.bind(this))

};

const ALL = "all";

Map2D.prototype = {
  setSize: function(height, width) {
    this.map = new Array(height);
    for (var i = 0; i < height; i++) {
      this.map[i] = new Array(width);
    }
    this.width = width;
    this.height = height;
  },

  add: function(layer, object, x, y) {
    var obj = this.map[y][x] || {};
    if (obj[layer] !== undefined) throw new Error('There is already object on layer "' + layer + '" x=' + x + ', y=' + y);
    obj[layer] = object;
    this.map[y][x] = obj;
    if (!this.objects[layer])
      this.objects[layer] = [];
    if (!this.objects[ALL])
      this.objects[ALL] = [];
    this.objects[layer].push(object);
    this.objects[ALL].push(object);
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
      obj = this.map[y][x][layer];
    }
    if (obj != undefined) {
      delete this.map[y][x][layer];
      this.objects[layer].splice(this.objects[layer].indexOf(obj), 1);
      this.objects[ALL].splice(this.objects[ALL].indexOf(obj), 1);
      return obj;
    }
    return undefined;
  },

  get: function(layer, x, y) {
    return this.map[this.y(y)][this.x(x)][layer];
  },


  moveObject: function(object, newX, newY) {
    this.remove(object.layer, object.x, object.y);
    this.add(object.layer, this.x(newX), this.y(newY));
  },

  objectMoved: function(object, oldX, oldY) {
    this.remove(object.layer, oldX, oldY);
    this.add(object.layer, object, this.x(object.x), this.y(object.y));

  },

  x: function(x) {
    while (x < 0) {
      x += this.cols;
    }
    return x % this.cols;
  },

  y: function(y) {
    while (y < 0) {
      y += this.rows;
    }
    return y % this.rows;
  },

  //here selectors
  distance2: function(x1, y1, x2, y2) {
    var dx = Math.abs(x2 - x1);
    var dx2 = Math.abs(x2 > x1 ? x1 + this.cols - x2 : x2 + this.cols - x1);
    var dy = Math.abs(y2 - y1);
    var dy2 = Math.abs(y2 > y1 ? y1 + this.cols - y2 : y2 + this.cols - y1);
    dx = dx < dx2 ? dx : dx2;
    dy = dy < dy2 ? dy : dy2;
    return dx*dx + dy*dy;
  },

  getObjectsAround: function(x, y, radius) {
    var radius2 = radius*radius;
    var objects = [];
    for (var dx = -radius; dx <= radius; dx++) {
      for (var dy = -radius; dy <= radius; dy++) {
        if (this.distance2(x, y, this.x(x+dx), this.y(y+dy)) <= radius2) {
          var layers = this.map[this.y(y+dy)][this.x(x+dx)];
          if (layers.object) objects.push(layers.object);
          if (layers.landscape) objects.push(layers.landscape);
        }
      }
    }
    return objects;
  },

  getObjectsBy: function(layer, filter) {
    if (filter === undefined) {
      filter = layer;
      layer = "all";
    }
    return this.objects[layer].filter(filter);
  }
};

module.exports = Map2D;