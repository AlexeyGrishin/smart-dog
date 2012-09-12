var Map2D = require('../core/server/game/map2d.js');

var mockObj = function() {
  this.locate = function(x, y) {
    this.x = x;
    this.y = y;
  }
};

module.exports = {

  setUp: function(cb) {
    this.map = new Map2D();
    cb();
  },

  testNormalization_negativeX: function(test) {
    this.map.setSize(5, 5);
    test.equals(4, this.map.x(-1));
    test.done();
  },

  testNormalization_negativeY: function(test) {
    this.map.setSize(5, 5);
    test.equals(3, this.map.y(-2));
    test.done();
  },

  testNormalization_positiveX: function(test) {
    this.map.setSize(5, 5);
    test.equals(2, this.map.x(7));
    test.done();
  },

  testNormalization_positiveY: function(test) {
    this.map.setSize(5, 5);
    test.equals(0, this.map.y(5));
    test.done();
  },

  testNormalization_inRange: function(test) {
    this.map.setSize(2,2);
    test.equals(0, this.map.x(0));
    test.equals(1, this.map.x(1));
    test.equals(0, this.map.y(0));
    test.equals(1, this.map.y(1));
    test.done();
  },

  testDistance: function(test) {
    this.map.setSize(10, 10);
    test.equals(8, this.map.distance2(4,4,6,6));
    test.equals(4, this.map.distance2(4,4,4,6));
    test.equals(4, this.map.distance2(4,6,4,4));
    test.done();

  },

  testDistance_samePoint: function(test) {
    this.map.setSize(10, 10);
    test.equals(0, this.map.distance2(3,3,3,3));
    test.done();
  },

  testDistance_crossHEdge: function(test) {
    this.map.setSize(10, 10);
    test.equals(1, this.map.distance2(0,5,9,5));
    test.done();

  },

  testDistance_crossVEdge: function(test) {
    this.map.setSize(10, 10);
    test.equals(4, this.map.distance2(4,0,4,8));
    test.done();
  },

  testDistance_crossCorner: function(test) {
    this.map.setSize(10, 10);
    test.equals(32, this.map.distance2(1,1,7,7));
    test.done();
  },

  testDirection_dx_oneStep: function(test) {
    this.map.setSize(10,10);
    test.deepEqual({dx:1, dy:0}, this.map.getDirection(0,0,1,0));
    test.done();
  },

  testDirection_dy_oneStep: function(test) {
    this.map.setSize(10,10);
    test.deepEqual({dx:0, dy:-1}, this.map.getDirection(1,1,1,0));
    test.done();
  },

  testDirection_dx_crossEdge: function(test) {
    this.map.setSize(10,10);
    test.deepEqual({dx:-1, dy:0}, this.map.getDirection(0,0,7,0));
    test.done();
  },

  testDirection_dy_crossEdge: function(test) {
    this.map.setSize(10,10);
    test.deepEqual({dx:0, dy:1}, this.map.getDirection(0,8,0,1));
    test.done();
  },

  testDirection_dy_diagonal: function(test) {
    this.map.setSize(10,10);
    test.deepEqual({dx:0, dy:1}, this.map.getDirection(0, 0, 3, 4));
    test.done();
  },

  testDirection_dx_diagonal: function(test) {
    this.map.setSize(10,10);
    test.deepEqual({dx:-1, dy:0}, this.map.getDirection(6, 6, 2, 5));
    test.done();
  },

  testGetObjectsAround: function(test) {
    this.map.setSize(10, 10);
    this.map.add("landscape", new mockObj, 5, 5);
    this.map.add("landscape", new mockObj, 5, 4);
    test.done();

  },
  testGetObjectsAround_leftEdge: function(test) {
    test.done();

  },
  testGetObjectsAround_topLeftCorner: function(test) {
    test.done();

  },
  testGetObjectsAround_bottomEdge: function(test) {
    test.done();

  },
  testGetObjectsAround_bottomRightEdge: function(test) {
    test.done();

  }

};