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
  maps: ['sheep', 'dog_barks_sheep', 'dog_barks_sheep_cascade', 'dog_help', 'real']
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
    var sc = helper.scenario({
      ally: {player: helper.player1, dog: helper.dog1},
      enemy: {player: helper.player2, dog: helper.dog2},
      hero: {player: helper.player1, dog: helper.dog1_2}
    });
    sc.move("enemy", "left").end();
    sc.move("enemy", "left").bark("enemy").end();
    sc.move("ally", "right").end();
    sc.move("ally", "right").bark("ally").end();
    sc.move("hero", "right").end();
    sc.move("hero", "down").end();
    sc.move("hero", "right").end();
    sc.move("hero", "right").bark("hero").end();
    sc.execute(cb);
  },

  real: function(helper, cb) {
    var sc = helper.scenario({
      ally: {player: helper.player1, dog: helper.dog1},
      enemy: {player: helper.player2, dog: helper.dog2}
    });
    sc.move("ally", "left").move("enemy", "up").end();
    sc.move("ally", "left").move("enemy", "left").end();
    sc.move("ally", "left").move("enemy", "left").end();
    sc.move("ally", "down").move("enemy", "left").bark("enemy").end();
    sc.move("ally", "left").bark("ally").move("enemy", "left").end();
    sc.move("ally", "left").move("enemy", "down").end();
    sc.move("ally", "up").move("enemy", "down").bark("enemy").end();
    sc.move("ally", "up").move("enemy", "down").end();
    sc.move("ally", "up").bark("ally").move("enemy", "left").end();
    sc.move("ally", "right").move("enemy", "down").end();
    sc.move("ally", "right").move("enemy", "down").end();
    sc.move("ally", "down").bark("ally").move("enemy", "down").bark("enemy").end();
    sc.move("ally", "left").move("enemy", "right").end();
    sc.move("ally", "left").move("enemy", "right").end();
    sc.move("ally", "left").move("enemy", "down").bark("enemy").end();
    sc.move("ally", "left").move("enemy", "right").end();
    sc.move("ally", "down").move("enemy", "right").end();
    sc.move("ally", "down").move("enemy", "right").bark("enemy").end();
    sc.move("ally", "left").move("enemy", "up").end();
    sc.move("ally", "left").move("enemy", "up").end();
    sc.move("ally", "left").move("enemy", "up").end();
    sc.move("ally", "left").move("enemy", "up").bark("ally").end();
    sc.move("ally", "up").end();
    sc.move("ally", "up").move("enemy", "down").bark("ally").end();
    sc.execute(cb);
  }
};

recordDemo();