require('nodetime').profile();
var GameServer = require('../../../core/server/game/game_server.js')
  , config = require('./server_config.json')
  , GameFactory = require('./game_object_factory.js')(config)
  , Maps = require('../../../core/server/game/maps.js')
  , SocketController = require('../../../core/server/socket_server/socket_controller.js')
  , SocketView = require('../../../core/server/socket_server/socket_view.js')
  , util = require('util')
  , SocketServer = require('../../../core/server/socket_server/socket_server.js')
  , HttpServer = require('../../../core/server/http_server/http_server.js')
  , MemoryStorage = require('../../../core/server/storage/mem_storage.js');

var storage = new MemoryStorage(config);
var gameServer = new GameServer(storage, new Maps(config.maps, GameFactory), GameFactory, config);

var socketServer = new SocketServer(function(socket) {
  return new SocketController(socket, gameServer);
}, config.controllerPort, function(socket) {
  return new SocketView(socket, gameServer);
}, config.viewPort);

var httpServer = new HttpServer(gameServer, config.httpPort, config.httpResources);