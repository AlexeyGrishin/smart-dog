var Sheep = require("../../games/smart-dog/server/sheep.js")
  , Game = require("../../core/server/game/game.js")
  , GameFactoryCtor = require("../../games/smart-dog/server/game_object_factory.js")
  , Helper = require("./../test_helper.js")
  , ex = Helper.ex;





function helper() {
  return new Helper(GameFactoryCtor);
}

var p;

var sheepTest = {

  initialState: {
    setUp: function(cb) {
      p = helper();
      p.init(["...", ".*.", "..."], {sheepStandBy:2, turnsLimit:100});
      p.game.start();
      cb();
    },

    tearDown: function(cb) {
      p.stop();
      p = null;
      cb();
    },

    testInitial: function(test) {
      var state = p.game.toState();
      test.deepEqual(state.objects, [{action: "standBy", type: "Sheep", x:1, y:1, direction: "down", layer:"object", owner:1}]);
      test.done();
    },

    testStandBy2turns: function(test) {
      p.skipTurn(function() {
        var state = p.game.toState();
        ex(test).contains(state.objects[0], {action: "standBy", type: "Sheep", x:1, y:1});
        p.skipTurn(function() {
          var state = p.game.toState();
          ex(test).contains(state.objects[0], {action: "standBy", type: "Sheep", x:1, y:1});
          test.done();
        })
      });
    },

    testMovementDownAfterStandBy: function(test) {
      p.skipTurns(3, function() {
        var state = p.game.toState();
        test.equals(state.objects.length, 1);
        ex(test).contains(state.objects[0], {action: "move", type: "Sheep", x:1, y:2, direction: "down", layer:"object", owner:1});
        test.done();
      });
    },

    testStandByAfterMovement: function(test) {
      p.skipTurns(4, function() {
        var state = p.game.toState();
        ex(test).contains(state.objects[0], {type: "Sheep", x:1, y:2, direction: "down"});
        p.skipTurn(function() {
          var state = p.game.toState();
          ex(test).contains(state.objects[0], {action: "standBy", type: "Sheep", x:1, y:2, direction: "down"});
          test.done();
        });
      });
    },

    testContinueMovementAfterStandBy: function(test) {
      p.skipTurns(6, function() {
        var state = p.game.toState();
        ex(test).contains(state.objects[0], {type: "Sheep", x:1, y:0, direction: "down"});
        test.done();
      });
    }
  },

  changeDirection: {
    setUp: function(cb) {
      p = helper();
      cb();
    },

    testShallMoveRightIfCannotDown: function(test) {
      p.init(["...", ".*.", ".#."], {sheepStandBy:0, turnsLimit:100});
      p.game.start();
      p.skipTurn(function() {
        var state = p.game.toState();
        ex(test).contains(state.objects[0], {x:2, y:1, type: "Sheep"});
        test.done();
      });
    },
    testShallMoveRightIfCannotDown_dog: function(test) {
      p.init(["...", ".*.", ".@."], {sheepStandBy:0, turnsLimit:100});
      p.game.start();
      p.skipTurn(function() {
        var state = p.game.toState();
        var sheep = state.objects.filter(function(o){return o.type =="Sheep"})[0];
        ex(test).contains(sheep, {x:2, y:1, type: "Sheep"});
        test.done();
      });
    },

    testShallMoveLeftIfCannotDownOrRight: function(test) {
      p.init(["...", ".*#", ".#."], {sheepStandBy:0, turnsLimit:100});
      p.game.start();
      p.skipTurn(function() {
        var state = p.game.toState();
        ex(test).contains(state.objects[0], {x:0, y:1, type: "Sheep"});
        test.done();
      });
    },
    testShallMoveUpIfCannotDownOrRightOrLeft: function(test) {
      p.init(["...", "#*#", ".#."], {sheepStandBy:0, turnsLimit:100});
      p.game.start();
      p.skipTurn(function() {
        var state = p.game.toState();
        ex(test).contains(state.objects[0], {x:1, y:0, type: "Sheep"});
        test.done();
      });
    },

    //TODO: add additional tests for movement

    tearDown: function(cb) {
      p.stop();
      p = null;
      cb();
    }
  },

  fear: {


    setUp: function(cb) {
      p = helper();
      this.bigMap = p.map({
        sheep: {x:5, y:5},
        dog: {x:7, y:5}
      });
      this.mapWithDogUnderSheep = p.map({
        sheep: {x:5, y:5},
        dog: {x:5, y: 6}
      });
      this.mapSheepGoRightInitially = p.map({
        sheep: {x: 5, y: 5},
        dog: {x:6, y:6},
        wall: {x:5, y:6}
      });
      cb();
    },

    testScaredOfBarking: function(test) {
      var state = p.initAndStart(this.bigMap, {dogBarkingR: 2, sheepStandBy: 5} );
      ex(test).contains(state.objects[0], {x:5, y:5, type: "Sheep"});
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {type: "Sheep", action: "panic", x: 4, y: 5});
          test.done();
        });
    },

    testDoNotFearIfFar: function(test) {
      var state = p.initAndStart(this.bigMap, {dogBarkingR: 1, sheepStandBy: 5} );
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {action: "standBy", x: 5, y: 5});
          test.done();
        });
    },

    testMoveUpIfScaredDown: function(test) {
      var state = p.initAndStart(this.mapWithDogUnderSheep, {dogBarkingR: 2, sheepStandBy: 5, turnsLimit:100} );
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 5, y: 4, action: "panic"});
          test.done();
        });
    },

    testScaryDistance: function(test) {
      p.initAndStart(this.mapWithDogUnderSheep, {dogBarkingR: 2, sheepStandBy: 15, sheepScaryTurns: 2, turnsLimit:100} );
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          //turn 1 done - shall be scary
          ex(test).contains(state.objects[0], {x: 5, y: 4, action: "panic", direction: "up"});
          p.skipTurn(function(state) {
            //turn 2 done - shall be scary
            console.log(state.objects[0]);
            ex(test).contains(state.objects[0], {action: "panic", x: 5, y: 3, direction: "up"});
            p.skipTurn(function(state) {
              //turn 3 done - shall be not scary
              ex(test).contains(state.objects[0], {action: "standBy", x: 5, y: 3, direction: "up"});
              test.done();
            })
          })
        });
    },

    testKeepDirectionAfterScared: function(test) {
      p.initAndStart(this.mapSheepGoRightInitially, {dogBarkingR: 2, sheepStandBy: 0, sheepScaryTurns: 1} );
      p.doNotExpectGameStop(test);
      p.skipTurn(function(state) {
        ex(test).contains(state.objects[0], {x: 6, y: 5, type: "Sheep", direction: "right"});
        p.makeTurn(function() {
          p.player1.bark(p.dog1.id, ex(test).noError());
        }).after(function(state) {
            ex(test).contains(state.objects[0], {x: 6, y: 4, type: "Sheep", direction: "up"});
            p.skipTurns(3, function(state) {
              ex(test).contains(state.objects[0], {type: "Sheep", direction: "up", action: "move"});
              test.done();
            })
          });
      })
    },

    testTwoSheeps: function(test) {
      p.initAndStart(p.map({
        sheep: {x:5, y:5},
        sheep2: {x:5, y:4},
        dog: {x:7, y: 5}
      }), {dogBarkingR: 2, sheepStandBy: 25, sheepScaryTurns: 2} );
      p.skipTurn(function(state) {
        ex(test).contains(state.objects[0], {x: 5, y: 4, type: "Sheep", direction: "down", action: "standBy"});
        ex(test).contains(state.objects[1], {x: 5, y: 5, type: "Sheep", direction: "down", action: "standBy"});
        test.done();
      });
    },

    testPanic: function(test) {
      p.initAndStart(p.map({
        sheep: {x:5, y:5},
        sheep2: {x:2, y:4},
        dog: {x:7, y: 5}
      }), {dogBarkingR: 2, sheepStandBy: 25, sheepScaryTurns: 2} );
      p.doNotExpectGameStop(test);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 2, y: 4, type: "Sheep", direction: "down", action: "standBy"});
          ex(test).contains(state.objects[1], {x: 4, y: 5, type: "Sheep", direction: "left", action: "panic"});
          p.skipTurn(function(state) {
            //shall stand by, but fear. shall move on next turn
            ex(test).contains(state.objects[0], {x: 2, y: 4, type: "Sheep", direction: "left", action: "panic"});
            ex(test).contains(state.objects[1], {x: 3, y: 5, type: "Sheep", direction: "left", action: "panic"});
            p.skipTurn(function(state) {
              //second sheep run, first one shall stand by
              ex(test).contains(state.objects[0], {x: 1, y: 4, type: "Sheep", direction: "left", action: "panic"});
              ex(test).contains(state.objects[1], {x: 3, y: 5, type: "Sheep", direction: "left", action: "standBy"});
              p.skipTurn(function(state) {
                //second sheep stops
                ex(test).contains(state.objects[0], {x: 1, y: 4, type: "Sheep", direction: "left", action: "standBy"});
                test.done();
              });
            });
          });
        });
    },

    tearDown: function(cb) {
      if (!p.game) return cb();
      p.stop();
      p = null;
      cb();
    }

  }

};

module.exports = sheepTest;
