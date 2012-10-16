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
    res.render('main');
  });

  const PER_PAGE = 40;
  const AROUND = 3;

  function paginate(pagingInfo, baseUrl) {
    var from = Math.max(pagingInfo.page - AROUND, 0);
    var to = Math.min(from + AROUND*2, pagingInfo.pagesCount-1);
    var pages = [];
    function addPage(val, kls, text) {
      var isPage = typeof val == "number";
      pages.push({
        val: text || (isPage ? (val+1).toString() : val),
        kls: kls ? kls : (isPage ? (val == pagingInfo.page ? "active" : "") : ""),
        url: isPage && kls != 'disabled' ? baseUrl + "page=" + (val+1) : null
      })
    }
    addPage(pagingInfo.page - 1, pagingInfo.page == 0 ? "disabled" : "", "«");
    if (from > 0) {
      addPage(0);
      if (from > 1) {
        addPage("...", "disabled");
      }
    }
    for (var i = from; i <= to; i++) {
      addPage(i);
    }
    if (to < pagingInfo.pagesCount-1) {
      if (to < pagingInfo.pagesCount-2) {
        addPage("...", "disabled");
      }
      addPage(pagingInfo.pagesCount-1);
    }
    addPage(pagingInfo.page + 1, pagingInfo.page == pagingInfo.pagesCount-1 ? "disabled" : "", "»");
    return pages;
  }

  function getPage(req) {
    var page = parseInt(req.param('page'))-1;
    if (page == undefined || isNaN(page)) page = 0;
    return page;
  }

  app.get('/games', function(req, res, next) {
    var hub = req.param('hub');
    var page = getPage(req);
    gameServer.listHubs(function(err, hubs) {
      if (hubs.length == 0) hubs = ["default"];
      if (hubs.indexOf(hub) == -1) hub = "default";
      res.render('hub', {hubs: hubs, currentHub: hub, currentPage: page+1});
    });
  });

  app.get('/gamesAjax', function(req, res, next) {
    var hub = req.param('hub');
    var page = getPage(req);
    gameServer.listGames2(hub, page, PER_PAGE, function(err, games) {
      if (err) return next(err);
      res.render('games', {games: games.content, layout: 'partial', pages: paginate(games, '/games?hub=' + encodeURIComponent(hub) + '&')});
    });
  });

  app.get('/players', function(req, res, next) {
    gameServer.listPlayers(req.param('hub'), function(err, players) {
      if (err) return next(err);
      res.render('players', {players: players.filter(function(p) {return p.score != undefined;}).sort(function(p1, p2) {return p2.score - p1.score;}), layout: 'partial'});
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
      if (game && game.finished)
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