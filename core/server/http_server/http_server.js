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
    app.use(expressLayouts);
    app.use(express.static(resources));
    app.use(function(err, req, res, next) {
      console.error(err);
      next(err, req, res, next);
    });

  });
  app.get('/', function(req, res){
    res.render('index');
  });
  app.get('/games', function(req, res, next) {
    gameServer.listGames(false, function(err, games) {
      if (err) return next(err);
      res.render('games', {games: games, layout: 'partial'});
    });
  });
  app.get('/players', function(req, res, next) {
    gameServer.listPlayers(function(err, players) {
      if (err) return next(err);
      res.render('players', {players: players.sort(function(p1, p2) {return p1.score - p2.score;}), layout: 'partial'});
    });
  });
  app.get('/player/:id', function(req, res) {
    gameServer.getPlayerInfo(req.param('id'), function(err, player) {
      if (player)
        res.render('player', {player: player});
      else
        res.sendfile('core/server/views/error.html');
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