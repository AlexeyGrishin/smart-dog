var pid = 1;
function createPlayerInterface(p) {
  var pi = {
    getId: function getId() { return this.id},
    getName: function getName() {return p.name},
    setController: function(io) {
      this.io = io;
    },
    id: pid++,
    start: function() {
      this.io.init(this);
      this.io.sendTurn()
    },
    toState: function() {
      return {
        turn: 1,
        objects: [],
        landscape: ["."],
        area: {x1:0,x2:1,y1:0,y2:1},
        playersCount: 4,
        playerId: this.id

      }
    },
    getGameOptions: function() {
      return {
        dogVisibilityR: 2,
        dogBarkingR: 2,
        sheepScaryTurns: 3,
        dogScaryTurns: 2,
        sheepStandBy: 4,
        turnsLimit: 1
      };
    },
    command: function() {
      //do nothing
    },
    endTurn: function endTurn() {
      if (!this.game || this.game.result) return;
      this.game.result = {finished: true, winner: this.game.players[0]};
      this.game.emit("game.stop");
    }
  };
  p.io.setPlayerInterface(pi);
  pi.io = p.io;
  return pi;
}

var StubFactory = {
  parseMapPart: function(cm) {
    return {};
  },


  createGame: function(id, gameToStart) {
    var e = new (require('events').EventEmitter);
    var game = {
      getId: function getId() {return id},
      getPlayers: function getPlayers() {return this.players},
      start: function start() {
        setTimeout(function() {
          this.players.forEach(function(p) {p.start()});
        }.bind(this), 0);
      },
      on: function() {e.on.apply(e, arguments)},
      emit: function() {e.emit.apply(e, arguments)},
      getGameResult: function getGameResult() {
        return this.result;
      }
    };
    game.players = gameToStart.players.map(createPlayerInterface);
    game.players.forEach(function setGame(p) {
      p.game = game;
    });
    return game;
  }
};

module.exports = StubFactory;