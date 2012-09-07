var Factory = require('../games/smart-dog/server/game_object_factory.js')
  , Map2d = require('../core/server/game/map2d.js');
var t = Factory.types;
module.exports = {
  testEmptyMap: function(test) {
    var ctor = Factory.parseMapPart([""]);
    test.done();
  },

  testOneItemMap: function(test) {
    var ctor = Factory.parseMapPart(["@"]);
    test.deepEqual([[{landscape:t.Grass, object:t.Dog}]], ctor);
    test.done();
  },

  testMapWithAllObjects: function(test) {
    var ctor = Factory.parseMapPart([
      ".@-#*"
    ]);
    test.deepEqual([[
      {landscape:t.Grass},
      {landscape:t.Grass, object:t.Dog},
      {landscape:t.Site},
      {landscape:t.Wall},
      {landscape:t.Site, object:t.Sheep}
    ]
    ], ctor);
    test.done();
  },

  fillMap: {
    setUp: function(cb) {
      this.ctor = Factory.parseMapPart(["@"]);
      console.log(this.ctor);
      this.map = new Map2d();
      this.game = Factory.createGame();
      this.p1 = {id:1};
      this.p2 = {id:2};
      this.p3 = {id:3};
      this.p4 = {id:4};
      cb();
    },

    for1player: function(test) {
      Factory.fillMap(this.ctor, [this.p1], this.map, this.game);
      test.equals(this.map.rows, 1);
      test.equals(this.map.cols, 1);
      test.equals(this.map.getObject(0, 0).type, t.Dog);
      test.equals(this.map.getObject(0, 0).owner, this.p1);
      test.done();
    },
    for2players: function(test) {
      Factory.fillMap(this.ctor, [this.p1, this.p2], this.map, this.game);
      test.equals(this.map.getObject(0, 0).type, t.Dog);
      test.equals(this.map.getObject(1, 1).type, t.Dog);
      test.equals(this.map.getObject(0, 1), undefined);
      test.equals(this.map.getObject(1, 0), undefined);

      test.equals(this.map.getObject(0, 0).owner, this.p1);
      test.equals(this.map.getObject(1, 1).owner, this.p2);
      test.done();
    },
    for3players: function(test) {
      Factory.fillMap(this.ctor, [this.p1, this.p2, this.p3], this.map, this.game);
      test.equals(this.map.getObject(0, 0).type, t.Dog);
      test.equals(this.map.getObject(0, 0).owner, this.p1);
      test.equals(this.map.getObject(1, 2).type, t.Dog);
      test.equals(this.map.getObject(1, 2).owner, this.p2);
      test.equals(this.map.getObject(3, 1).type, t.Dog);
      test.equals(this.map.getObject(3, 1).owner, this.p3);
      test.done();
    },
    for4players: function(test) {
      Factory.fillMap(this.ctor, [this.p1, this.p2, this.p3, this.p4], this.map, this.game);
      test.equals(this.map.getObject(1, 1).type, t.Dog);
      test.equals(this.map.getObject(1, 1).owner, this.p1);
      test.done();
    }
  }

};

//module.exports.fillMap.setUp(function() {});
//module.exports.fillMap.for1player({});

