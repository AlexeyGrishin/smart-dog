var Sheep = require("../../games/smart-dog/server/sheep.js")
  , Game = require("../../core/server/game/game.js")
  , GameFactoryCtor = require("../../games/smart-dog/server/game_object_factory.js")
  , Helper = require("./../test_helper.js")
  , ex = Helper.ex;




var IoMock = {
  setPlayerInterface: function() {}
};
function helper() {
  return new Helper(GameFactoryCtor, IoMock);
}

var p;

var dogTest = {
  movement: {
    setUp: function(cb) {
      p = helper();
      this.simpleMap = p.map({dog: {x:5, y:5}});
      this.dogNearSite = p.map({dog: {x:5, y:5}, site: {x:5, y:6}});
      this.dogSheepWall = p.map({dog: {x:5, y:5}, wall: {x:4, y:5}, sheep: {x:5, y:4}});
      cb();
    },

    tearDown: function(cb) {
      p.stop();
      p = null;
      cb();
    },

    moveLeft: function(test) {
      p.initAndStart(this.simpleMap, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "left", ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 4, y: 5, type: "Dog"});
          test.done();
        });
    },

    moveTwice: function(test) {
      p.initAndStart(this.simpleMap, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "left", ex(test).noError());
        p.player1.move(p.dog1.id, "left", ex(test).errorStartingWith(p.dog1.id));
      }).after(function(state) {
          test.done();
        });
    },

    moveRight: function(test) {
      p.initAndStart(this.simpleMap, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "right", ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 6, y: 5, type: "Dog"});
          test.done();
        });
    },

    moveUp: function(test) {
      p.initAndStart(this.simpleMap, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "up", ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 5, y: 4, type: "Dog"});
          test.done();
        });

    },

    moveDown: function(test) {
      p.initAndStart(this.simpleMap, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "down", ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 5, y: 6, type: "Dog"});
          test.done();
        });
    },

    moveSite: function(test) {
      p.initAndStart(this.dogNearSite, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "down", ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[0], {x: 5, y: 6, type: "Dog"});
          test.done();
        });

    },

    cannotMoveDueToSheep: function(test) {
      p.initAndStart(this.dogSheepWall, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "up", function(err) {
          test.ok(err.indexOf(p.dog1.id + " ") == 0);
          test.done();
        });
      })
    },

    cannotMoveDueToWall: function(test) {
      p.initAndStart(this.dogSheepWall, {});
      p.makeTurn(function() {
        p.player1.move(p.dog1.id, "left", function(err) {
          test.ok(err.indexOf(p.dog1.id + " ") == 0);
          test.done();
        });
      })

    },

    moveEnemy: function(test) {
      p.initAndStart(this.simpleMap, {}, 2);
      p.makeTurn(function() {
        p.player1.move(p.dog2.id, "down", ex(test).errorStartingWith(p.dog2.id));
      }).after(function(state) {
          test.done();
        });
    }
  },

  visibility: {
    setUp: function(cb) {
      p = helper();
      cb();
    },
    tearDown: function(cb) {
      p.stop();
      p = null;
      cb();
    },
    seesOnlyObjectsInRadius: function(test) {
      p.initAndStart([
        ".......",
        "...**..",
        ".....*.",
        "...@.*.",
        ".......",
        ".......",
        "......."
      ], {dogVisibilityR: 2});
      p.makeTurn(function() {
        var state = p.player1.toState();
        test.equal(state.objects.length, 3);
        ex(test).contains(state.objects[0], {type: "Sheep", x: 3, y: 1});
        ex(test).contains(state.objects[1], {type: "Dog", x: 3, y: 3});
        ex(test).contains(state.objects[2], {type: "Sheep", x: 5, y: 3});
        test.done();
      });

    }

  },

  barking: {
    setUp: function(cb) {
      p = helper();
      this.map = [
        "...",
        ".@.",
        "..."
      ];
      this.map2dogs = [
        ".....",
        ".@.@.",
        "....."
      ];
      cb();
    },
    tearDown: function(cb) {
      p.stop();
      p = null;
      cb();
    },

    barkTwice: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 8, dogScaryTurns: 2}, 2);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
        p.player1.bark(p.dog1.id, ex(test).errorStartingWith(p.dog1.id));
      }).after(function(state) {
          test.done();
        });
    },

    barkEnemy: function(test) {
      p.initAndStart(this.map, {}, 2);
      p.makeTurn(function() {
        p.player2.bark(p.dog1.id, ex(test).errorStartingWith(p.dog1.id));
      }).after(function(state) {
          test.done();
        });
    },

    barkTwoTurns: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 8, dogScaryTurns: 2}, 2);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          p.makeTurn(function() {
            p.player1.bark(p.dog1.id, ex(test).noError());

          }).after(function() {
              test.done();
            })
        });
    },

    enemyDogScared: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 8, dogScaryTurns: 2}, 2);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[1], {type: "Dog", action: "panic", x: 4, y: 4});
          test.done();
        });
    },

    enemyDogCannotMoveAndBark: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 8, dogScaryTurns: 2}, 2);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {

          p.makeTurn(function() {
            p.player2.bark(p.dog2.id, ex(test).errorStartingWith(p.dog2.id));
            p.player2.move(p.dog2.id, "left", ex(test).errorStartingWith(p.dog2.id));
            test.done();
          });
        });
    },

    enemyDogDoNotFearIfFar: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 3, dogScaryTurns: 2}, 2);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[1], {type: "Dog", action: "move", x: 4, y: 4});
          test.done();
        });
    },

    enemyDogIndignantOnHisArea: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 3, dogScaryTurns: 2}, 2);
      var move = function(where, cb) {
        p.makeTurn(function() {
          p.player1.move(p.dog1.id, where, ex(test).noError());
        }).after(cb);
      };
      move("right", function() {
        move("right", function() {
          move("down", function() {
            move("down", function() {
              p.makeTurn(function() {
                //now we are on the enemy area. bark!
                p.player1.bark(p.dog1.id, ex(test).noError());
              }).after(function(state) {
                  ex(test).contains(state.objects[1], {type: "Dog", action: "indignant", x: 4, y: 4});
                  test.done();
                });
            })
          })
        })
      });
    },

    enemyDogCannotBarkOnHisArea: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 3, dogScaryTurns: 2}, 2);
      var move = function(where, cb) {
        p.makeTurn(function() {
          p.player1.move(p.dog1.id, where, ex(test).noError());
        }).after(cb);
      };
      move("right", function() {
        move("right", function() {
          move("down", function() {
            move("down", function() {
              p.makeTurn(function() {
                //now we are on the enemy area. bark!
                p.player1.bark(p.dog1.id, ex(test).noError());
              }).after(function() {
                  p.makeTurn(function() {
                    p.player2.bark(p.dog2.id, ex(test).errorStartingWith(p.dog2.id));
                    p.player2.move(p.dog2.id, "right", ex(test).noError());
                    test.done();
                  });
                });
            })
          })
        })
      });
    },

    concurentBark: function(test) {
      p.initAndStart(this.map, {dogBarkingR: 8, dogScaryTurns: 2}, 2);
      p.makeTurn(function() {
        p.player1.bark(p.dog1.id, ex(test).noError());
        p.player2.bark(p.dog2.id, ex(test).noError());
      }).after(function(state) {
          ex(test).contains(state.objects[1], {type: "Dog", action: "panic", x: 4, y: 4});
          ex(test).contains(state.objects[0], {type: "Dog", action: "panic", x: 1, y: 1});
          test.done();
        });

      test.done();

    },

    allyBarkCancelsPanic: function(test) {
      var state = p.initAndStart(this.map2dogs, {dogBarkingR: 3, dogScaryTurns: 50}, 2);
      ex(test).contains(state.objects[2], {type: "Dog", action: "move", x: 6, y: 4, owner: 2});
      var enemyDog = p.controller(p.player1, p.dog1_2);
      var allyDog = p.controller(p.player2, p.dog2_2);
      enemyDog.move("down", function() {
        enemyDog.move("right", function() {
          enemyDog.bark(function(state) {
            ex(test).contains(state.objects[2], {type: "Dog", action: "panic", x: 6, y: 4, owner: 2});
            allyDog.bark(function(state) {
              ex(test).contains(state.objects[2], {type: "Dog", action: "move", x: 6, y: 4, owner: 2});
              test.done();
            });
          });
        })
      });

    },


    allyBarkSameTurnDoesNotCancelPanic: function(test) {
      var state = p.initAndStart(this.map2dogs, {dogBarkingR: 3, dogScaryTurns: 50}, 2);
      ex(test).contains(state.objects[2], {type: "Dog", action: "move", x: 6, y: 4, owner: 2});
      var enemyDog = p.controller(p.player1, p.dog1_2);
      var allyDog = p.controller(p.player2, p.dog2_2);
      enemyDog.move("down", function() {
        enemyDog.move("right", function() {
          p.player1.bark(p.dog1_2.id, ex(test).noError());
          p.player2.bark(p.dog2_2.id, ex(test).noError());
          p.skipTurn(function(state) {
            ex(test).contains(state.objects[2], {type: "Dog", action: "panic", x: 6, y: 4, owner: 2});
            test.done();
          });
        })
      });
    }

  }



};

module.exports = dogTest;