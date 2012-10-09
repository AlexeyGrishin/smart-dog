var Factory = require('../../games/smart-dog/server/game_object_factory.js')()
  , Map2d = require('../../core/server/game/map2d.js');
var t = require('../../games/smart-dog/server/game_object_factory.js').types;

var io = {
  setPlayerInterface: function(p) {}
};

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
      ".@-#*o"
    ]);
    test.deepEqual([[
      {landscape:t.Grass},
      {landscape:t.Grass, object:t.Dog},
      {landscape:t.Site},
      {landscape:t.Wall},
      {landscape:t.Grass, object:t.Sheep},
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
      this.p1 = {name:1, io:io};
      this.p2 = {name:2, io:io};
      this.p3 = {name:3, io:io};
      this.p4 = {name:4, io:io};
      this.createGame = function(players) {
        this.game = Factory.createGame(1, {players: players, map: this.map, mapCtor: this.ctor, mapName: "test"});
      };

      cb();
    },


    for1player: function(test) {
      this.createGame([this.p1]);
      test.equals(this.map.rows, 1);
      test.equals(this.map.cols, 1);
      test.equals(this.map.getObject(0, 0).type, "Dog");
      test.equals(this.map.getObject(0, 0).owner.name, this.p1.name);
      test.done();
    },
    for2players: function(test) {
      this.createGame([this.p1, this.p2]);
      test.equals(this.map.getObject(0, 0).type, "Dog");
      test.equals(this.map.getObject(1, 0).type, "Dog");

      test.equals(this.map.getObject(0, 0).owner.name, this.p1.name);
      test.equals(this.map.getObject(1, 0).owner.name, this.p2.name);
      test.done();
    },
    for3players: function(test) {
      this.createGame([this.p1, this.p2, this.p3]);
      test.equals(this.map.getObject(0, 0).type, "Dog");
      test.equals(this.map.getObject(0, 0).owner.name, this.p1.name);
      test.equals(this.map.getObject(1, 1).type, "Dog");
      test.equals(this.map.getObject(1, 1).owner.name, this.p2.name);
      test.equals(this.map.getObject(2, 2).type, "Dog");
      test.equals(this.map.getObject(2, 2).owner.name, this.p3.name);
      test.done();
    },
    for4players: function(test) {
      this.createGame([this.p1, this.p2, this.p3, this.p4]);
      test.equals(this.map.getObject(0, 0).type, "Dog");
      test.equals(this.map.getObject(0, 0).owner.name, this.p1.name);
      test.done();
    }
  }

};

//module.exports.fillMap.setUp(function() {});
//module.exports.fillMap.for1player({});

