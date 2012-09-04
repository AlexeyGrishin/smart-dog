var express = require('express')
  , app = express()
  , io = require('socket.io').listen(3002)
  , vio = require('socket.io').listen(3003)
  , expressLayouts = require('express-ejs-layouts')
  , GameServer = require('./game_server.js')
  , GameFactory = require('./game_object_factory.js')
  , Maps = require('./maps.js')
  , SocketController = require('./socket_controller.js')
  , SocketView = require('./socket_view.js')
  , util = require('util');

var gameServer = new GameServer(new Maps(GameFactory), GameFactory, {waitForPlayer: 4000} );

app.configure(function(){
  app.set('views', 'core/server/views');
  app.set('view engine', 'ejs');
  //app.use(expressLayouts);
  app.use(express.static('core/client/public'));

});
app.get('/', function(req, res){
  res.render('index');
});
app.get('/games', function(req, res) {
  res.render('games', {games: gameServer.listGames(true)});
});
app.get('/:id', function(req, res) {
  var game = gameServer.getGame(req.param('id'));
  if (game)
    res.render('view', {game: game});
  else
    res.sendfile('core/server/views/error.html');
});


setInterval(function() {
  console.log("Server status: ");
  gameServer.listGames().forEach(function(g) {
    console.log("   " + util.inspect(g.brief));
  });
}, 10000);

io.sockets.on('connection', function (socket) {
  console.log('%s: %s - connected, wait for login', socket.id.toString(), socket.handshake.address.address);
  var socketController = new SocketController(socket, gameServer);
});

vio.sockets.on('connection', function(socket) {
  console.log('%s: %s - viewer connected', socket.id.toString(), socket.handshake.address.address);
  //TODO: if have views then have pause between turns
  var socketView = new SocketView(socket, gameServer);
});

app.listen(3000);