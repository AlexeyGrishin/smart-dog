var ai = require('../src/ai.js')
  , bot = require('../src/bot.js')
  , nodemock = require("nodemock");

const SHALL_BARK = true;
const SHALL_STAND = false;

function locate(dog, x, y) {
  dog.x = x;
  dog.y = y;
}

function createDog(x, y, shallMove, shallBark) {
  var dog = shallMove ? nodemock.mock("move").takes(shallMove) : nodemock.mock("move").fail();
  if (shallBark) dog.mock("bark"); else dog.mock("bark").fail();
  locate(dog, x, y);
  return dog;
}

var AiTest = {

  moving: {
    setUp: function(cb) {
      this.landscape = new bot.Landscape([
        "........",
        ".1......",
        ".....1..",
        "........",
        "........"
      ], {rows: 5, cols: 8, you: 1, dogBarkingR: 2});
      cb();
    },


    testMoveToNearestSheep: function(test) {
      var dog = createDog(3, 2, "left");
      var sheep1 = {x:1, y:2};
      var sheep2 = {x:5, y:4};
      ai.turn([dog], [sheep1, sheep2], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();
    },

    testMoveToNearestSheep_findPath: function(test) {
      var sheep = {x:4, y:2};
      var landscape = this.landscape;
      function stepDog(x, y, move) {
        var dog = createDog(x, y, move);
        landscape.setObjects([dog, sheep]);
        ai.turn([dog], [sheep], [], [], landscape);
        test.ok(dog.assert());
      }
      stepDog(5, 2, "up");
      stepDog(5, 1, "left");
      stepDog(4, 1, "left");
      stepDog(3, 1, "down");
      test.done();
    },

    testMoveToPointToBarkTheSheep: function(test) {
      var dog = createDog(1, 0, "up");
      var sheep1 = {x:1, y:2};
      ai.turn([dog], [sheep1], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();

    },

    testBarkIfThatPointSheepToSite: function(test) {
      var dog = createDog(1, 3, SHALL_STAND, SHALL_BARK);
      var sheep1 = {x:1, y:2};
      ai.turn([dog], [sheep1], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();
    },

    testDoNotBarkIfThatDoesNotPointSheepToSite: function(test) {
      var dog = createDog(0, 2, "down");
      var sheep1 = {x:1, y:2};
      ai.turn([dog], [sheep1], [], [], this.landscape);
      test.ok(dog.assert());
      test.done();
    }



  },

  attacking: {

    setUp: function(cb) {
      this.landscape = new bot.Landscape([
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
      var dog2 = createDog(0, 1, "left");
      var sheepOnEnemySite = {x:9, y:1};
      var enemyDog = {x:3, y:1};
      ai.turn([this.firstDog(), dog2], [{x:1, y:2}, sheepOnEnemySite], [enemyDog], [], this.landscape);
      test.ok(dog2.assert());
      test.done();
    },

    testAttackingDogGoesToNearestEnemyDogIfNoSheepOnEnemySite: function(test) {
      var dog2 = createDog(0, 1, "right");
      var enemyDog = {x:3, y:1};
      ai.turn([this.firstDog(), dog2], [{x:1, y:2}], [enemyDog], [], this.landscape);
      test.ok(dog2.assert());
      test.done();
    },

    testAttackingDogShallBarkIfInRadius: function(test) {
      var dog2 = createDog(0, 1, "down", SHALL_BARK);
      var enemyDog = {x:0, y:2};
      ai.turn([this.firstDog(), dog2], [{x:1, y:2}], [enemyDog], [], this.landscape);
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
