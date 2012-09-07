var characters = {
  '.': function() {return {type: 'Grass'}},
  '#': function() {return {type: 'Wall'}},
  '1': function() {return {type: 'Site', owner: 1}},
  '2': function() {return {type: 'Site', owner: 2}},
  '3': function() {return {type: 'Site', owner: 3}},
  '4': function() {return {type: 'Site', owner: 4}}
};

function parseMap(charMap) {
  var objects = [];
  for (var y = 0; y < charMap.length; y++) {
    for (var x = 0; x < charMap[y].length; x++) {
      var ctor = characters[charMap[y][x]];
      if (!ctor) throw "Unknown character: " + charMap[y][x];
      var obj = ctor();
      obj.x = x;
      obj.y = y;
      objects.push(obj);
    }
  }
  return objects;
}

var GameView = {

  init: function() {
    this.renderer = new Renderer($("#game")[0]);
    this.playersShown = false;
    $("#game").on("render", $.proxy(this.postRender, this));
  },

  update: function(update) {
    if (update.landscape && update.landscape.length > 0 && !this.landscape) {
      this.landscape = parseMap(update.landscape);
    }
    if (!this.playersShown) {
      $(".players").html(
        update.players.map(function(p) {return "<span class='player" + p.id + "'>" + p.name + "</span>"}).join("<br>")
      );
      this.playersShown = true;
    }
    update.landscape = this.landscape;
    this.renderer.update(update);
    if (update.winner) {
      this.onFinished(update);
    }
  },

  postRender: function(r, update) {
    //do something
    $("#turn").html(update.turn);
  },

  onFinished: function(update) {
    var stats = ["Game is over"];
    if (update.winner) {
      stats.push("Winner is " + update.winner.name);
    }
    if (update.reason && update.reason != "") {
      stats.push("Game was stopped becase of " + update.reason);
    }
    $(".alert").removeClass("alert-error").addClass("alert-success").html(stats.join("<br>")).show().removeClass("hidden");
  },

  replay: function(data) {
    this.renderer.stop();
    var replay = data.replay;
    this.landscape = parseMap(replay[0].landscape);
    for (var i = 0; i < replay.length; i++) {
      replay[i].landscape = this.landscape;
      this.renderer.update(replay[i]);
    }
  }

};

$(function() {
  var gameId = $("body").attr("data-id");
  var socket = io.connect('http://localhost:3003');
  var viewCmd = 'view';
  var errorCmd = 'error';
  var endCmd = 'end';
  GameView.init();
  socket.on('connect', function() {
    socket.send('listen ' + gameId);
    socket.on('message', function (data) {
      console.log(">" + data);
      if (data.indexOf(viewCmd) == 0) {
        var updatedView = JSON.parse(data.substring((viewCmd + " " + gameId).length));
        GameView.update(updatedView);
      }
      else if (data.indexOf(errorCmd) == 0) {
        var error = data.substring((errorCmd + " " + gameId).length);
        $(".alert").html(error).removeClass("hidden");
      }
      else if (data.indexOf(endCmd) == 0) {
        var updatedView = JSON.parse(data.substring((endCmd + " " + gameId).length));
        GameView.update(updatedView);
        $(".replay").removeClass("disabled");
      }
    });
    $(".replay").click(function() {
      $.getJSON('/' + gameId + '/replay', function(data) {
        GameView.replay(data);
      });
    });
  });

});