var readline = require('readline')
  , GameObject = require('../core/server/game/game_object.js')
  , EventEmitter = require('events').EventEmitter
  , util = require('util');



var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function processConsole() {
  rl.question(">", processAnswer);
}

var objects = [];
var gobjects = [];
var game = null;
const STEP = 10*1000;

var Object1 = function() {
  var p = {x:1, y:2, layer:"object", owner:1};

};
Object1.prototype = {
  a: function() {return b();},
  b: function() {return c();},
  c: function() {return d();}
};

function createGame() {
  var g = new EventEmitter();
  g.setMaxListeners(10000);
  var m = {};
  g.getMap = function() {return m};
  return g;
}

function processAnswer(str) {
  var cmd = str.replace(/\n$/, '');
  switch (cmd) {
    case "exit":
      rl.close();
      process.exit();
      break;
    case "+o":
      for (var i = 0; i < STEP; i++) {
        objects.push(new Object1());
      }
      break;
    case "-o":
      objects = null;
      objects = [];
      break;
    case "+g":
      if (!game) game = createGame();
      for (var i = 0; i < STEP; i++) {
        gobjects.push(new GameObject(game, {x:1, y:2, layer:"object", owner:1}));
      }
      break;
    case "+1g":
      if (!game) game = createGame();
      gobjects.push(new GameObject(game, {x:1, y:2, layer:"object", owner:1}));
      console.log("events - " + GameObject.Event)
      break;

    case "-g":
      gobjects = null;
      gobjects = [];
      break;
    case "-gamel":
      game.removeAllListeners();
    case "-game":
      game = null;
      break;
    default:
      if (process[cmd]) {
        console.log("process." + cmd);
        process[cmd]();
      }
      else if (global[cmd]) {
        console.log("global." + cmd);
        global[cmd]();
      }
      else {
        console.log("Unknown command :(");
      }

  }
  showMemory();
  return processConsole();
}

function showMemory() {
  console.log("-------------------------");
  var mem = process.memoryUsage();
  console.log(util.format("Objects: %d    Game objects: %d    Game exists: %s", objects.length, gobjects.length, game == null ? "no" : "yes"));
  if (objects.length == 0) {
    console.log("Game object size: " + mem.heapUsed / gobjects.length);
  }
  else if (gobjects.length == 0) {
    console.log("Object size: " + mem.heapUsed / objects.length);
  }
  console.log(util.format("RSS: %d MB Heap: %d MB / %d MB", mb(mem.rss), mb(mem.heapUsed), mb(mem.heapTotal)));
  console.log();
}

function mb(bytes) {
  return Math.round(bytes / 1024 / 1024);
}

showMemory();
processConsole();
