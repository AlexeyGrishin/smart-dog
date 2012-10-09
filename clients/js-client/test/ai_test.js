var ai = require('../src/ai.js')
  , nodemock = require("nodemock");

var AiTest = {

  moving: {
    setUp: function(cb) {
      this.landscape = new ai.Landscape([
        "........",
        ".1......",
        ".....1..",
        "........",
        "........"
      ], {rows: 5, cols: 8, you: 1, dogBarkingR: 2});

      cb();
    },


    testMoveToNearestSheep: function(test) {
      var dog = nodemock.mock("move").takes("left").mock("bark").fail();
      dog.x = 3; dog.y = 2;
      var sheep1 = {x:1, y:2};
      var sheep2 = {x:5, y:4};
      ai.AI.turn([dog], [sheep1, sheep2], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();
    },

    testMoveToPointToBarkTheSheep: function(test) {
      var dog = nodemock.mock("move").takes("up").mock("bark").fail();
      dog.x = 1; dog.y = 0;
      var sheep1 = {x:1, y:2};
      ai.AI.turn([dog], [sheep1], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();

    },

    testBarkIfThatPointSheepToSite: function(test) {
      var dog = nodemock.mock("move").fail().mock("bark");
      dog.x = 1; dog.y = 3;
      var sheep1 = {x:1, y:2};
      ai.AI.turn([dog], [sheep1], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();
    },

    testDoNotBarkIfThatDoesNotPointSheepToSite: function(test) {
      var dog = nodemock.mock("move").takes("down").mock("bark").fail();
      dog.x = 0; dog.y = 2;
      var sheep1 = {x:1, y:2};
      ai.AI.turn([dog], [sheep1], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();
    }



  },

  attacking: {

    setUp: function(cb) {
      this.landscape = new ai.Landscape([
        "............",
        ".1.......2..",
        "............"
      ], {rows: 3, cols: 12, you: 1, dogBarkingR: 2});
      this.firstDog = function() {
        var dog = nodemock.mock("move").mock("bark");
        dog.x = 0; dog.y = 0;
        return dog;
      };
      cb();
    },

    testAttackingDogGoesToNearestSheep: function(test) {
      var dog2 = nodemock.mock("move").takes("left");
      dog2.x = 0; dog2.y = 1;
      var sheepOnEnemySite = {x:9, y:1};
      var enemyDog = {x:3, y:1};
      ai.AI.turn([this.firstDog(), dog2], [{x:1, y:2}, sheepOnEnemySite], [enemyDog], [], this.landscape);
      test.ok(dog2.assert());
      test.done();
    },

    testAttackingDogGoesToNearestEnemyDogIfNoSheepOnEnemySite: function(test) {
      var dog2 = nodemock.mock("move").takes("right");
      dog2.x = 0; dog2.y = 1;
      var enemyDog = {x:3, y:1};
      ai.AI.turn([this.firstDog(), dog2], [{x:1, y:2}], [enemyDog], [], this.landscape);
      test.ok(dog2.assert());
      test.done();
    },

    testAttackingDogShallBarkIfInRadius: function(test) {
      var dog2 = nodemock.mock("move").takes("down").mock("bark");
      dog2.x = 0; dog2.y = 1;
      var enemyDog = {x:0, y:2};
      ai.AI.turn([this.firstDog(), dog2], [{x:1, y:2}], [enemyDog], [], this.landscape);
      test.ok(dog2.assert());
      test.done();
    }
  }


};


module.exports = AiTest;
if (process.argv[2] == 'run') {
  var F = function() {};
  AiTest.attacking.setUp(F);
  AiTest.attacking.testAttackingDogGoesToNearestSheep({ok: F, done: F});
}
