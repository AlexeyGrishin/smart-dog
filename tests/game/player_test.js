var Sheep = require("../../games/smart-dog/server/sheep.js")
  , Game = require("../../core/server/game/game.js")
  , GameFactoryCtor = require("../../games/smart-dog/server/game_object_factory.js")
  , Helper = require("./../test_helper.js")
  , ex = Helper.ex;

function helper() {
  return new Helper(GameFactoryCtor);
}


var playerTest = {
  setUp: function(cb) {
    p = helper();
    cb();
  },

  tearDown: function(cb) {
    p.stop();
    p = null;
    cb();
  },

  testInitialState: function(test) {
    p.initAndStart([
      "....-........@*#"
    ], {dogVisibilityR: 1});
    p.makeTurn(function() {
      test.deepEqual(p.player1.toState(), {
        turn: 0,
        playerId: 1,
        playersCount: 1,
        landscape: [
          "....1..........#"
        ],
        objects: [
          {type: "Dog", x: 13, y:0, action: "move", owner: 1, id:p.dog1.id},
          {type: "Sheep", x: 14, y:0, action: "standBy", direction: "down"}
        ],
        area: {
          x1:0, y1:0, x2:15, y2:0
        }
      });
      test.done();
    });
  },

  testVoice: function(test) {
    p.initAndStart([
      "....-........@*#"
    ], {dogVisibilityR: 1});
    p.makeTurn(function() {
      p.player1.bark(p.dog1.id, ex(test).noError());
    }).after(function() {
        p.makeTurn(function() {
          test.deepEqual(p.player1.toState(), {
            turn: 1,
            playerId: 1,
            playersCount: 1,
            landscape: [
              "....1..........#"
            ],
            objects: [
              {type: "Dog", x: 13, y:0, action: "move", owner: 1, id:p.dog1.id, voice: "barking"},
              {type: "Sheep", x: 14, y:0, action: "panic", direction: "right"}
            ],
            area: {
              x1:0, y1:0, x2:15, y2:0
            }
          });
          test.done();
        })
      });
  },

  test2Players: function(test) {
    p.initAndStart([
      "....-........@*#"
    ], {dogVisibilityR: 1}, 2);
    p.makeTurn(function() {
      test.deepEqual(p.player2.toState(), {
        turn: 0,
        playerId: 2,
        playersCount: 2,
        landscape: [
          "....1..........#................",
          "....................2..........#"
        ],
        objects: [
          {type: "Dog", x: 29, y:1, action: "move", owner: 2, id:p.dog2.id},
          {type: "Sheep", x: 30, y:1, action: "standBy", direction: "down"}
        ],
        area: {
          x1:16, y1:1, x2:31, y2:1
        }
      });
      test.done();
    });
  },


  testAnonimize: function(test) {
    p.initAndStart([
      "....-........@*#"
    ], {dogVisibilityR: 1}, 2);
    p.makeTurn(function() {
      p.player1.bark(p.dog1.id, ex(test).noError());
    }).after(function() {
        p.makeTurn(function() {
          test.deepEqual(p.player2.toState(), {
            turn: 1,
            playerId: 2,
            playersCount: 2,
            landscape: [
              "....1..........#................",
              "....................2..........#"
            ],
            objects: [
              {type: "Dog", x: 29, y:1, action: "move", owner: 2, id:p.dog2.id},
              {type: "Sheep", x: 30, y:1, action: "standBy", direction: "down"},
              {x: 13, y:0, voice: "barking"}
            ],
            area: {
              x1:16, y1:1, x2:31, y2:1
            }
          });
          test.done();

        })
      });
  }

};

module.exports = playerTest;