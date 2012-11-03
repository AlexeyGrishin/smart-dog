//Following lines commented because they are related to performance testing
//Both modules (nodetime and look) works under *nix only.
//require('nodetime').profile();
//require('look').start(5959, '127.0.0.1');
var GameServer = require('../../../core/server/game/game_server.js')
  , GameFactory = require('./game_object_factory.js')()
  , Maps = require('../../../core/server/game/maps.js')
  , SocketController = require('../../../core/server/socket_server/socket_controller.js')
  , SocketView = require('../../../core/server/socket_server/socket_view.js')
  , util = require('util')
  , fs = require('fs')
  , path = require('path')
  , SocketServer = require('../../../core/server/socket_server/socket_server.js')
  , HttpServer = require('../../../core/server/http_server/http_server.js')
  , MemoryStorage = require('../../../core/server/storage/mem_storage.js').MemoryStorage
  , CouchStorage = require('../../../core/server/storage/couch_storage.js')
  , ReplayStorage = require('../../../core/server/storage/mem_storage.js').ReplayStorage
  , GamesStorage = require('../../../core/server/storage/games_storage.js')
  , _ = require('cloneextend');

var configPath = path.join(path.dirname(module.filename), 'server_config.json');
var configSourcePath = path.join(path.dirname(module.filename), 'server_config.source.json');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, fs.readFileSync(configSourcePath));
}

config = require('./server_config.json');

var storagesByType = {
  "MemoryStorage": MemoryStorage,
  "CouchStorage": CouchStorage
};
var storageConfig = config.storages[config.storage];

var storage = new GamesStorage({
  gamesStorage: new storagesByType[storageConfig.type](storageConfig),
  replayStorage: new ReplayStorage(config)
});
var maps = new Maps(config.maps, config.games.default, GameFactory);

["solo", "duet", "trio", "quartet"].forEach(function(hub) {
  maps.addHub(hub, _.cloneextend(config.games.default, config.games[hub]));
});

var gameServer = new GameServer(storage, maps, GameFactory, config);
gameServer.init(function(err) {
  if (err) {
    throw err;
  }
  var socketServer = new SocketServer(function(socket) {
    return new SocketController(socket, gameServer);
  }, config.controllerPort, function(socket) {
    return new SocketView(socket, gameServer);
  }, config.viewPort);

  var httpServer = new HttpServer(gameServer, config.httpPort, config.httpResources);

});

function showMemory() {
  console.log("-------------------------");
  var mem = process.memoryUsage();
  console.log(util.format("RSS: %d MB Heap: %d MB / %d MB", mb(mem.rss), mb(mem.heapUsed), mb(mem.heapTotal)));
  console.log();
}

function mb(bytes) {
  return Math.round(bytes / 1024 / 1024);
}

setInterval(showMemory, 5000);