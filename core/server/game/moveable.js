
var Moveable = {
  extendMap: function(mapHelper, map) {
    mapHelper.canMoveTo = this._canMoveTo.bind(mapHelper);
    mapHelper.getBarrier = this._getBarrier.bind(mapHelper);
  },

  _canMoveTo: function(x, y) {
    return this.at(x, y).every(function(o) {
      return (o.layer == 'landscape' && o.traversable);
    })
  },

  _getBarrier: function(x, y) {
    var barriers = this.at(x, y).filter(function(o) {
      return (o.layer != 'landscape' || !o.traversable);
    });
    return barriers.length > 0 ? barriers[0] : null;
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
          return cb("Cannot move to " + newX + ", " + newY + " - there is a non traversable landscape or another object");
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

  selector: function(sel) {
    //no special required
  }
};


module.exports = Moveable;
