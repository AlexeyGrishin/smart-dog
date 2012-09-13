//TODO: introduce style selector on page

$.fn.backgroundImageUrl = function(options) {
  if (options){
    return this.each(function(){
      $(this).css('backgroundImage','url:('+options+')');
    });
  }else {
    var pattern = /url\(|\)|"|'/g;
    var bgImage = $(this).css('backgroundImage');
    if (!bgImage || bgImage == 'none') return null;
    return bgImage.replace(pattern,"");
  }
};

function Renderer(canvas) {
  this.canvas = $(canvas);
  this.ctx = canvas.getContext("2d");
  this.doInit = this.init;
  this.toDraw = [];
  var div = $("<div></div>").appendTo($("body"));
  this.styles = {};
  var styles = this.styles;
  setTimeout($.proxy(function() {
    $.each(["player1", "player2", "player3", "player4", "grass", "wall", "sheep", "sheep scary"], function(i, cls) {
      div.addClass(cls);
      styles[cls] = {
        color: div.css('color'),
        bgColor: div.css('backgroundColor')
      };
      var bgImage = div.backgroundImageUrl();
      if (bgImage) {
        var img = new Image();
        img.src = bgImage;
        styles[cls].bgImage = img;
      }
      div.removeClass(cls);
    });

  }, this), 0);
}

Renderer.prototype = {

  BLOCK: 20,
  OBJ_PAD: 0,
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
    if (this.toDraw.length > 0) {
      var state = this.toDraw.shift();
      this.draw(state);
      this.canvas.trigger("render", state);
    }
    //else - show 'waiting
  },

  draw: function(state) {
    try {
      if (!state.partial) {
        //TODO: make code better
        this.ctx.fillStyle = "white";
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.landscape = $("<canvas></canvas>").hide().appendTo($("body"))
          .attr("width", this.width)
          .attr("height", this.height);
        var ctx = this.ctx;
        this.ctx = this.landscape[0].getContext("2d");
        $.each(state.landscape, $.proxy(this.render, this));
        this.ctx = ctx;

      }
      this.ctx.drawImage(this.landscape[0], 0, 0);
      $.each(state.objects, $.proxy(this.render, this));
    }
    catch (e) {
      console.error(e);
      throw e;
    }
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
    var pic = null;
    switch (el.type) {
      case "Grass":
      case "Sheep":
      case "Wall":
        var style = this.styles[el.type.toLowerCase()];
        ctx.fillStyle = style.bgColor;
        if (el.scary) {
          style = this.styles["sheep scary"];
        }
        pic = style.bgImage;
        break;
      case "Dog":
        var style = this.styles["player" + player];
        ctx.fillStyle = style.color;
        pic = style.bgImage;
        break;
      case "Site":
        ctx.fillStyle = this.styles["player" + player].bgColor;
        break;
      default:
        throw "Unknown type - " + el.type;
    }
    if (pic) {
      ctx.drawImage(pic, bounds.x, bounds.y, bounds.width+1, bounds.height+1);
    }
    else {
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    if (el.voice == "barking") {
      //do bark
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bounds.x+bounds.width, bounds.y-20, 40, 20);
      ctx.strokeRect(bounds.x+bounds.width, bounds.y-20, 40, 20);
      ctx.font = "9";
      ctx.strokeStyle = "#000000";
      ctx.strokeText("WOOF!", bounds.x+bounds.width+3, bounds.y-3);
    }

  }

};