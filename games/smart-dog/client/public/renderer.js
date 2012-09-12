function Renderer(canvas) {
  this.canvas = $(canvas);
  this.ctx = canvas.getContext("2d");
  this.doInit = this.init;
  this.toDraw = [];
  var div = $("<div></div>").appendTo($("body"));
  this.colors = {};
  var colors = this.colors;
  setTimeout($.proxy(function() {
    $.each(["player1", "player2", "player3", "player4", "grass", "wall", "sheep"], function(i, cls) {
      div.addClass(cls);
      colors[cls] = {
        color: div.css('color'),
        bgColor: div.css('backgroundColor')
      };
      div.removeClass(cls);
    });

  }, this), 0);
}

Renderer.prototype = {

  BLOCK: 15,
  OBJ_PAD: 3,
  DRAW_EACH: 0.5,

  stop: function() {
    clearInterval(this.updator);
    this.updator = null;
    this.toDraw = [];
  },

  init: function(state) {
    var calcWidth = state.width * this.BLOCK;
    if (calcWidth > screen.width - 200) {
      this.BLOCK = (screen.width - 200) / state.width;
      this.OBJ_PAD = this.BLOCK / 5;
    }
    this.canvas.attr("width", state.width * this.BLOCK).attr("height", state.height * this.BLOCK);
    this.width = state.width*this.BLOCK;
    this.height = state.height*this.BLOCK;
    this.players = state.players;
    this.doInit = function() {};
  },

  update: function(state) {
    this.doInit(state);
    this.toDraw.push(state);
    if (!this.updator) {
      this.updator = setInterval($.proxy(this.doDraw, this), this.DRAW_EACH * 1000);
      this.doDraw();
    }
  },

  doDraw: function() {
    try {
      if (this.toDraw.length > 0) {
        var state = this.toDraw.shift();
        this.draw(state);
        this.canvas.trigger("render", state);
      }
    }
    catch (e) {
      console.log(e);
    }
    //else - show 'waiting
  },

  //TODO: performance: draw landscape once, then re-draw only cells where objects were
  draw: function(state) {
    if (!state.partial) {
      this.ctx.fillStyle = "white";
      this.ctx.clearRect(0, 0, this.width * this.BLOCK, this.height * this.BLOCK);
    }
    $.each(state.landscape, $.proxy(this.render, this));
    $.each(state.objects, $.proxy(this.render, this));
  },


  render: function(i, el) {
    var bounds = {
      x: el.x * this.BLOCK,
      y: el.y * this.BLOCK,
      width: this.BLOCK,
      height: this.BLOCK
    };
    if (el.layer == "object") {
      bounds.x+=this.OBJ_PAD;
      bounds.y+=this.OBJ_PAD;
      bounds.width-=this.OBJ_PAD*2;
      bounds.height-=this.OBJ_PAD*2;
    }
    var ctx = this.ctx;
    var player = parseInt(el.owner);
    switch (el.type) {
      case "Grass":
      case "Sheep":
      case "Wall":
        ctx.fillStyle = this.colors[el.type.toLowerCase()].bgColor;
        break;
      case "Dog":
        ctx.fillStyle = this.colors["player" + player].color;
        break;
      case "Site":
        ctx.fillStyle = this.colors["player" + player].bgColor;
        break;
      default:
        throw "Unknown type - " + el.type;
    }
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    if (el.voice == "barking") {
      //do bark
      ctx.strokeStyle = "#ffffff";
      ctx.font = "9";
      ctx.strokeText("!", bounds.x+5, bounds.y + bounds.height);
    }

  }

};