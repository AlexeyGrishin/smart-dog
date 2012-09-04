var GameView = {

  init: function() {
    this.renderer = new Renderer($("#game")[0]);
    $("#game").on("render", $.proxy(this.postRender, this));
  },

  update: function(update) {
    this.renderer.update(update);
  },

  postRender: function(r, update) {
    //do something
    $("#turn").html(update.turn);
  }

};

$(function() {
  var gameId = $("body").attr("data-id");
  var socket = io.connect('http://localhost:3003');
  var viewCmd = 'view ' + gameId;
  GameView.init();
  //TODO: error and end
  socket.on('connect', function() {
    socket.send('listen ' + gameId);
    socket.on('message', function (data) {
      console.log(">" + data);
      if (data.indexOf(viewCmd) == 0) {
        //TODO: errors
        var updatedView = JSON.parse(data.substring(viewCmd.length));
        GameView.update(updatedView);
        $("#log").html(JSON.stringify(updatedView));
      }
    });
  });
});