


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
    var stats = ["Game is over"];
    if (update.winner) {
      stats.push("Winner is " + update.winner.name);
    }
    if (update.reason && update.reason != "") {
      stats.push("Game was stopped becase of " + update.reason);
    }
    $(".alert").removeClass().addClass("alert alert-success").html(stats.join("<br>"));
  },

  replay: function(from, to) {
    this.gameViewer.replay(from, to);
  }
};

$(function() {
  var gameId = $("h1").attr("data-id");
  var socket = io.connect("http://" + window.location.hostname + ':3003');
  var viewCmd = 'view';
  var errorCmd = 'error';
  var endCmd = 'end';
  GameView.init();
  socket.on('connect', function() {
    socket.send('listen ' + gameId);
    socket.on('message', function (data) {
      console.log(">" + data);
      if (data.indexOf(viewCmd) == 0) {
        //ignore right now
        $(".alert").removeClass().html("Please wait until game is finished...").addClass("alert alert-info");
      }
      else if (data.indexOf(errorCmd) == 0) {
        var error = data.substring((errorCmd + " " + gameId).length);
        $(".alert").html(error).removeClass("hidden");
      }
      else if (data.indexOf(endCmd) == 0) {
        var updatedView = JSON.parse(data.substring((endCmd + " " + gameId).length));
        GameView.onFinished(updatedView);
        GameView.loadReplay(gameId);
      }
    });
  });

});