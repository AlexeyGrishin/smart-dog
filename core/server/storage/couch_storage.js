var nano = require('nano')
  , Entities = require('./entities.js');

/**
 * Stores games and players info into the couchDB.
 * For the most of writing operations assumes that there will be no conflicts (so only one process/thread performs writing). For current smart-dog implementation it is true.
 * @param config
 * @constructor
 */
var CouchDBStorage = function(config) {
  this._config = config;
  this._nano = nano(config.dbUrl);
  this._runningGames = {};
};

function gameId(id) {
  return 'game.' + id;
}

function playerId(id) {
  return 'player.' + id;
}

const HUBS = '*hubs';

CouchDBStorage.prototype = {
  //Creates DB if not created
  initDB: function(cb) {
    var nano = this._nano;
    var dbName = this._config.db;
    var that = this;

    var initViews = function(cb) {
      that._createViews(function(err, body) {
        return cb(err);
      });
    };

    nano.db.get(dbName, function(err, db) {
      if (err) {
        nano.db.create(dbName, function() {
          that._db = nano.use(dbName);
          that._db.insert({hubs: []}, HUBS, function(err, body) {
            if (err) return cb(err);
            initViews(cb);
          });
        })
      }
      else {
        that._db = nano.use(dbName);
        initViews(cb);
      }
    })
  },

  _createViews: function(cb) {
    var expected = {
      language: 'javascript',
      views: {
        'all_games': {
          'map': 'function(doc) {' +
            'if (doc.type == "GameInfo") emit(doc._id, doc);' +
            '}'
        },
        'all_players': {
          'map': 'function(doc) { if (doc.type == "PlayerInfo") emit(doc._id, doc);}'
        },
        'max_id': {
          'map': 'function(doc) { if (doc.type == "GameInfo") emit(1, doc.id);}',
          'reduce': '_stats'
        },
        'games_by_hub': {
          'map': 'function(doc) {' +
            'if (doc.type == "GameInfo") emit(doc.hub, doc);' +
            '}'
        }
      }
    };
    var DESIGN = '_design/games';
    this._db.insert(expected, DESIGN, function(err, body) {
      if (err) {
        this._saveActual(DESIGN, function(design) {
          design.views = expected.views;
        }, cb);
      }
      else {
        return cb(null);
      }
    }.bind(this));
  },

  putGame: function(id, gameInfo, cb) {
    var finished = gameInfo.finished;
    if (finished) return this.putFinishedGame(id, gameInfo, cb);
    this.putRunningGame(id, gameInfo, cb);
  },

  putRunningGame: function(id, gameInfo, cb) {
    this._runningGames[id] = gameInfo;
    cb(null);
  },

  putFinishedGame: function(id, gameInfo, cb) {
    delete this._runningGames[id];
    this._db.insert(toJson(gameInfo), gameId(id), cb);
  },

  getGame: function(id, cb) {
    if (this._runningGames[id]) {
      return cb(null, this._runningGames[id]);
    }
    this._db.get(gameId(id), function(err, body) {
      if (err) return cb(err);
      return cb(null, fromJson(body));
    })
  },

  putPlayer: function(id, playerInfo, cb) {
    this._save(playerId(id), toJson(playerInfo), cb, function() {
      return cb("Unexpected conflict!");
    });
  },

  getPlayer: function(id, cb) {
    this._db.get(playerId(id), function(err, body) {
      if (err) return cb(err);
      return cb(null, fromJson(body));
    })
  },

  listPlayers: function(cb) {
    this._db.view('games', 'all_players', function(err, body) {
      if (err) return cb(err);
      cb(null, body.rows.map(function(row) {
        return fromJson(row.value);
      }));
    })
  },

  listGames: function(hub, paging, cb) {
    //TODO: for now I just get all games from DB. but it will be better to get only portion of them
    this._db.view('games', 'games_by_hub', {keys: [hub]}, function(err, body) {
      if (err) return cb(err);
      var games = body.rows.map(function(row) {return fromJson(row.value)});
      if (paging.originalSort) games = games.sort(paging.originalSort);
      var pagingInfo = {
        pagesCount: Math.ceil(games.length / paging.perPage)
      };
      pagingInfo.page = Math.min(paging.page, pagingInfo.pagesCount);
      pagingInfo.content = games.slice(pagingInfo.page * paging.perPage, Math.min((pagingInfo.page + 1) * paging.perPage, games.length));
      cb(null, pagingInfo);
    })
  },

  reset: function(cb) {
    this._nano.db.destroy(this._config.db, cb);
  },

  initAndGetNextId: function(cb) {
    this.initDB(function(err) {
      if (err) return cb(err);
      this._db.view('games', 'max_id', function(err, body) {
        if (err) return cb(err);
        cb(null, body.rows.length > 0 ? parseInt(body.rows[0].value.max) + 1 : 1);
      })
    }.bind(this))
  },

  addHub: function(hub, cb) {
    this._saveActual(HUBS, function(hubs) {
      if (hubs.hubs.indexOf(hub) == -1) {
        hubs.hubs.push(hub);
      }
    }, cb);
  },

  listHubs: function(cb) {
    this._db.get(HUBS, function(err, body) {
      return cb(err, body ? body.hubs.slice() : null)
    })
  },

  _save: function(id, object, cb, conflictCb) {
    if (id) {
      this._db.get(id, function(error, body) {
        if (error) {
          if (error.message == "missing") {
            return this._db.insert(object, id, cb);
          }
          return cb(error);
        }
        Object.keys(object).forEach(function(item) {
          body[item] = object[item];
        });
        this._db.insert(body, id, function(error, res) {
          if (error) {
            if (error.message == "Document update conflict.")
              return conflictCb();
            return cb(error);
          }
          cb(error, body);
        });
      }.bind(this))
    }
    else {
      this.db.insert(object, cb);
    }
  },

  _saveActual: function(id, change, cb) {
    var doActualChange = function() {
      this._db.get(id, function(error, body) {
        if (error) return cb(error);
        change(body);
        this._save(id, body, cb, doActualChange);
      }.bind(this));
    }.bind(this);
    doActualChange();
  }

};


function toJson(obj) {
  var json = {};
  for (var k in obj) {
    if (obj.hasOwnProperty(k) && typeof(obj[k]) != 'function') {
      json[k] = obj[k];
    }
  }
  return json;
}

function fromJson(json) {
  var obj = new Entities[json.type]();
  for (var k in json) {
    if (json.hasOwnProperty(k)) {
      obj[k] = json[k];
    }
  }
  return obj;
}

module.exports = CouchDBStorage;
