
var Moveable = {
  extendMap: function(mapHelper, map) {
    mapHelper.canMoveTo = this._canMoveTo.bind(mapHelper);
  },

  _canMoveTo: function(x, y) {
    return this.at(x, y).every(function(o) {
      return (o.layer == 'landscape' && o.traversable);
    })
  },

  extendClass: function(classCtor) {
      classCtor.prototype.__defineGetter__('traversable', function() {
        return this.p.traversable;
      });
      classCtor.prototype.__defineGetter__('moveable', function() {return this.p.moveable;});
      classCtor.prototype.move = function(dx, dy, cb) {
        var p = this.p;
        var newX = p.map.x(p.x+dx);
        var newY = p.map.y(p.y+dy);
        if (!p.$.canMoveTo(newX, newY)) {
          return cb("Cannot move at " + dx + ", " + dy);
        }
        var oldX = p.x, oldY = p.y;
        p.x = newX;
        p.y = newY;
        p.game.emit("gameobject.move", this, oldX, oldY);
        p.oldPosition = {
          x: oldX,
          y: oldY,
          dx: dx,
          dy: dy
        };
        cb();
    };
    var oldExtend = classCtor.prototype._extend;
    classCtor.prototype._extend = function(p) {
      if (!p.$) p.$ = p.game.$;
      oldExtend.call(this, p);
    }
  },

  extendObject: function(mapHelper, object, p, extendOptions) {
    if (extendOptions && extendOptions.traversable) {
      object.__defineGetter__('traversable', function(){return true;})
    }
    else {
      object.__defineGetter__('moveable', function(){return true;})
      object.move = function(dx, dy, cb) {
        var newX = p.map.x(p.x+dx);
        var newY = p.map.y(p.y+dy);
        if (!mapHelper.canMoveTo(newX, newY)) {
          return cb("Cannot move at " + dx + ", " + dy);
        }
        var oldX = p.x, oldY = p.y;
        p.x = newX;
        p.y = newY;
        p.game.emit("gameobject.move", this, oldX, oldY);
        p.oldPosition = {
          x: oldX,
          y: oldY,
          dx: dx,
          dy: dy
        };
        cb();
      }
    }
  },

  selector: function(sel) {
    //no special required
  }
};


module.exports = Moveable;
