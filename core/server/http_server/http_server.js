var express = require('express')
  , app = express()
  , expressLayouts = require('express-ejs-layouts');

var HttpServer = function(gameServer, port, resources) {
  this.gameServer = gameServer;
  this.port = port;
  this.init(resources);
};

HttpServer.prototype.init = function(resources) {
  var gameServer = this.gameServer;
  app.configure(function(){
    app.set('views', 'core/server/views');
    app.set('view engine', 'ejs');
    //app.use(expressLayouts);
    app.use(express.static(resources));

  });
  app.get('/', function(req, res){
    res.render('index');
  });
  app.get('/games', function(req, res, next) {
    gameServer.listGames(false, function(err, games) {
      if (err) return next(err);
      res.render('games', {games: games});
    });
  });
  app.get('/:id', function(req, res) {
    gameServer.getGame(req.param('id'), function(err, game) {
      if (game)
        res.render('view', {game: game});
      else
        res.sendfile('core/server/views/error.html');
    });
  });
  app.get('/:id/replay', function(req, res, next) {
    gameServer.getGameReplayFile(req.param('id'), function(err, replayFile) {
      if (err) return next(err);
      res.sendfile(replayFile);
    })
  });
  app.listen(this.port);

};

module.exports = HttpServer;