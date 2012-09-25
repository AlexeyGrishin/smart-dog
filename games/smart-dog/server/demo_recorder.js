var GameServer = require('../../../core/server/game/game_server.js')
  , config = require('./server_config.json')
  , GameFactory = require('./game_object_factory.js')(config)
  , Maps = require('../../../core/server/game/maps.js')
  , util = require('util')
  , MemoryStorage = require('../../../core/server/storage/mem_storage.js');

var storage = new MemoryStorage(config);
var gameServer = new GameServer(storage, new Maps(config.maps, GameFactory), GameFactory, config);
