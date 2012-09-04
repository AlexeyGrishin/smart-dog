//test code

var Game = require("./game.js");

var map = [];
for (var i = 0; i < 10; i++) {
  var ar = [];
  for (var j = 0; j < 10; j++) {
    ar.push(null);
  }
  map.push(ar);
}

var game = new Game(map);

var Controller = function(pi) {
  this.pi = pi;
};

Controller.prototype = {

  makeTurn: function(cb) {
    console.log("Player#" + this.pi.id);
    var state = this.pi.genState();
    console.log(state);
    process.stdout.write(">");
    var reactor = function(data) {
      var cmd = data.substr(0, data.length-1);
      switch (cmd) {
        case "up":
          this.pi.move(state.hero.id, 0, -1);
          cb(null);
          break;
        case "left":
          this.pi.move(state.hero.id, -1, 0);
          cb(null);
          break;
        case "down":
          this.pi.move(state.hero.id, 0, 1);
          cb(null);
          break;
        case "right":
          this.pi.move(state.hero.id, 1, 0);
          cb(null);
          break;
        default:
          console.log(" Unknown command");
          process.stdout.write(">");
          process.stdin.once("data", reactor);
      }
    }.bind(this);
    process.stdin.once("data", reactor);
  }
};

process.stdin.resume();
process.stdin.setEncoding('utf8');

var player1 = game.registerPlayer("player1");
player1.setController(new Controller(player1));
var player2 = game.registerPlayer("player2");
player2.setController(new Controller(player2));
game.registerViewer().setView(function(state) {
  console.log("Turn#" + state.turn);
  state.objects.forEach(function(item) {
    console.log(item);
  });
  console.log();
});

game.startGame();