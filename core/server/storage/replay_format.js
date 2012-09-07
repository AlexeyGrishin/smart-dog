var ReplayFormat = {

  getFirstState: function(state) {
    return {
      turn: state.turn,
      objects: state.objects.filter(function(o) {return o.layer != "landscape"}),
      players: state.players,
      landscape: state.landscape,
      winner: state.winner,
      reason: state.reason,
      width: state.width,
      height: state.height
    }
  },

  getNextState: function(state) {
    return {
      turn: state.turn,
      objects: state.objects.filter(function(o) {return o.layer != "landscape"}),
      landscape: undefined,
      players: state.players,
      winner: state.winner,
      reason: state.reason,
      width: state.width,
      height: state.height
    }
  },

  getGameInfo: function(game) {
    return {
      game: game.getId(),
      map: game.getMapName(),
      rows: game.getMap().rows,
      cols: game.getMap().cols,
      players: game.toState().players
    }
  }

};

module.exports = ReplayFormat;