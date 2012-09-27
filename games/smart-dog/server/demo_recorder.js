var config = require('./server_config.json')
  , GameFactory = require('./game_object_factory.js')
  , Maps = require('../../../core/server/game/maps.js')
  , util = require('util')
  , Helper = require('../../../tests/test_helper.js')
  , fs = require('fs')
  , path = require('path')
  , ReplayDataStorer = require('../../../core/server/storage/replay_data_storer.js');

var demos = {
  mapDir: './games/smart-dog/demo',
  recDir: './games/smart-dog/client/public/replays',
  maps: ['sheep', 'dog_barks_sheep', 'dog_barks_sheep_cascade', 'dog_help']
};

function recordDemo() {
  fs.rmdir(demos.recDir);
  fs.mkdir(demos.recDir);
  demos.maps.forEach(function(map) {
    var helper = new Helper(GameFactory);
    var mapInfo = Maps.readMap(path.join(demos.mapDir, map+'.txt'));

    helper.init(mapInfo.map, mapInfo.opts, mapInfo.opts.players);
    var replay = new ReplayDataStorer(helper.game);
    helper.start();
    Demo[map](helper, function() {
      console.log("         >>>> " + map + " <<<<<<");
      helper.stop();
      fs.writeFile(path.join(demos.recDir, map + '.json'), JSON.stringify(replay.getReplay()));
    });
  });
}

var Demo = {
  sheep: function(helper, cb) {
    helper.skipTurns(30, cb);
  },

  dog_barks_sheep: function(helper, cb) {
    var c = helper.controller(helper.player1, helper.dog1);
    c.move("up", function() {
      c.move("up", function() {
        c.bark(function() {
          c.waitForEnd(cb);
        })
      })
    })
  },

  dog_barks_sheep_cascade: function(helper, cb) {
    var c = helper.controller(helper.player1, helper.dog1);
    c.move("up", function() {
      c.move("up", function() {
        c.move("right", function() {
          c.move("right", function() {
            c.move("up", function() {
              c.bark(function() {
                c.skip(21, function() {
                  c.bark(function() {
                    c.waitForEnd(cb);
                  })
                });
              })
            })
          })
        })
      })
    })
  },

  dog_help: function(helper, cb) {
    var ally_dog = helper.controller(helper.player1, helper.dog1);
    var enemy_dog = helper.controller(helper.player2, helper.dog2);
    var our_dog = helper.controller(helper.player1, helper.dog1_2);
    enemy_dog.move("up", function() {
      enemy_dog.move("up", function() {
        enemy_dog.move("up", function() {
          enemy_dog.bark(function() {
            ally_dog.move("right", function() {
              ally_dog.move("right", function() {
                ally_dog.bark(function() {
                  our_dog.move("right", function() {
                    our_dog.move("down", function() {
                      our_dog.move("right", function() {
                        our_dog.move("down", function() {
                          our_dog.bark(function() {
                            our_dog.waitForEnd(cb);
                          })
                        })
                      })
                    });
                  });
                });
              })
            })
          })
        });
      });
    });
  }
};

recordDemo();