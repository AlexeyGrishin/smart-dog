


var GameView = {

  init: function() {
    this.gameViewer = new GameViewer($("#game"));
  },

  loadReplay: function(gameId) {
    $.getJSON('/' + gameId + '/replay', function(data) {
      GameView.gameViewer.setReplay(data.replay);
      GameView.gameViewer.goToFrame(GameView.gameViewer.getMaxFrame());
    });
  },

  onFinished: function(update) {
    $(".players").html(
      update.players.map(function(p) {return "<div class='player" + p.id + "'><span>" + p.name + "</span><em>" + p.score.toFixed(2) + "</em></div>"}).join("")
    );
    if (update.winner) {
      $(".player"+update.winner.id).addClass("winner");
    }
    if (update.error && update.error != "") {
      $(".alert").removeClass("alert alert-success hidden").addClass("alert alert-error").html("Game was stopped becase of " + update.reason);
    }
  },

  replay: function(from, to) {
    this.gameViewer.replay(from, to);
  }
};

$(function() {
  var gameId = $("h1").attr("data-id");
  GameView.init();
  GameView.loadReplay(gameId);
});