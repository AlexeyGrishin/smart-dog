/*
  Classes in this package:

  Renderer - defines how to render game state on canvas
  GameViewer - rules playback
 */

var VIEW_CLASSES = "sheep grass dog wall tree player1 player2 player3 player4 scared barking barking-area arrow helped player-area".split(" ");

var characters = {
  '.': function() {return {type: 'Grass'}},
  '^': function() {return {type: 'Tree'}},
  '#': function() {return {type: 'Wall'}},
  '1': function() {return {type: 'Site', owner: 1}},
  '2': function() {return {type: 'Site', owner: 2}},
  '3': function() {return {type: 'Site', owner: 3}},
  '4': function() {return {type: 'Site', owner: 4}}
};

function parseMap(charMap) {
  var objects = [];
  objects.xy = {};
  for (var y = 0; y < charMap.length; y++) {
    for (var x = 0; x < charMap[y].length; x++) {
      var ctor = characters[charMap[y][x]];
      if (!ctor) throw "Unknown character: " + charMap[y][x];
      var obj = ctor();
      obj.x = x;
      obj.y = y;
      objects.push(obj);
      objects.xy[x + '_' + y] = obj;
    }
  }
  return objects;
}


function GameViewer(canvas, controls) {
  this.canvas = $(canvas);
  this.renderer = new Renderer(this.canvas[0]);
  this.controls = controls;
  if (!controls) {
    this.controls = this._createControls();
  }
  this._initControls();
  $(canvas).on("render", $.proxy(this._onRender, this));
  $(canvas).on("stop", $.proxy(this.stop, this));
  $(canvas).on("resized", $.proxy(this._onResize, this));
  $(canvas).trigger("viewer.init");
}

GameViewer.prototype = {
  _createControls: function() {
    var $controls = $("<div></div>").addClass("controls row-fluid").hide();
    $controls.append($("<a href='javascript:void(0)'><i class='icon-play'></i></a>").addClass("btn btn-small btn-primary play"));
    $controls.append($("<a href='javascript:void(0)'><i class='icon-stop'></i></a>").addClass("btn btn-small stop"));
    $controls.append($("<div></div>").addClass("slider"));
    $controls.append($("<div><span class='turn-label'>Turn # </span> <span class='turn'></span> </div>").addClass("turn-container"));
    this.canvas.before($controls);
    return $controls;
  },

  _initControls: function() {
    $(".play", this.controls).click($.proxy(function() {
      if (this.currentFrame == this.maxFrame) {
        this.play(this.minFrame);
      }
      else {
        this.play(this.currentFrame);
      }
    }, this));
    $(".stop", this.controls).click($.proxy(function() {
      this.renderer.stop(true);
    }, this));
    $(".slider", this.controls).slider({
      slide: $.proxy(function(e, ui) {
        this.goToFrame(ui.value);
      }, this)
    });
  },

  _onResize: function() {
    this.controls.width(this.canvas.width());
  },

  _onRender: function(e, u) {
    this.currentFrame = u.turn+1;
    $(".slider", this.controls).slider({
      value:u.turn+1
    });
    $(".turn", this.controls).html(u.turn+1);
  },


  setReplay: function(replay) {
    this.stop();
    this.replay = replay;
    this.landscapeShown = false;
    this.minFrame = 0;
    this.currentFrame = this.minFrame;
    this.maxFrame = replay.length - 1;
    this.landscape = parseMap(replay[0].landscape);
    $(".slider", this.controls).slider({
      min: this.minFrame,
      max: this.maxFrame,
      value: this.currentFrame
    });
    this.isPlaying = false;
    this.controls.show();
  },

  play: function(from, to) {
    if (this.isPlaying) this.stop();
    from = typeof from == 'number' ? from : this.minFrame;
    to = typeof to == 'number' ? to : this.getMaxFrame();
    for (var i = from; i <= to; i++) {
      if (!this.landscapeShown) {
        this.replay[i].landscape = this.landscape;
      }
      else {
        this.replay[i].partial = true;
      }
      this.renderer.update(this.replay[i]);
      this.landscapeShown = true;
    }
    this.isPlaying = true;
    $(this.canvas).trigger("viewer.play");
  },

  stop: function() {
    this.isPlaying = false;
    this.renderer.stop();
    $(this.canvas).trigger("viewer.stop");
  },

  goToFrame: function(frame) {
    if (this.isPlaying) {
      this.play(frame);
    }
    else {
      this.stop();
      this.play(frame, frame);
      this.isPlaying = false;
    }
  },

  getMinFrame: function() {
    return this.minFrame;
  },

  getMaxFrame: function() {
    return this.maxFrame;
  }

};


function Canvas(renderer, canvas) {
  if (!canvas) {
    canvas = $("<canvas></canvas>").hide().appendTo($("body"));
  }
  this.canvas = canvas;
  this.ctx = canvas[0].getContext("2d");
  this.renderer = renderer;
  this.enabled = true;
}

Canvas.prototype = {
  setSize: function(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.attr("width", width).attr("height", height);
  },

  getContext: function() {
    return this.ctx;
  },

  setEnabled: function(e) {
    this.enabled = e;
  },

  render: function(el, el_if_first_is_index) {
    if (!this.enabled) return;
    if (typeof el == 'number') {
      this._renderElement(el_if_first_is_index);
    }
    else if ($.isArray(el)) {
      $.each(el, this.render.bind(this));
    }
    else {
      this._renderElement(el);
    }
  },

  _renderElement: function(el) {
    this.renderer(el, this.ctx);

  },

  clear: function() {
    if (!this.enabled) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  flush: function(mainCtx) {
    if (!this.enabled) return;
    if (mainCtx instanceof Canvas) {
      mainCtx = mainCtx.getContext();
    }
    if (this.ctx != mainCtx) {
      mainCtx.drawImage(this.canvas[0], 0, 0);
    }
  }

};

function CanvasStack(canvases) {
  this.canvases = [];
  Object.keys(canvases).forEach(function(name) {
    this[name] = canvases[name];
    this.canvases.push(canvases[name]);
  }.bind(this));
}

Object.keys(Canvas.prototype).forEach(function(m) {
  CanvasStack.prototype[m] = function() {
    var targs = arguments;
    this.canvases.forEach(function(c) {
      c[m].apply(c, targs);
    });
  }
});


function Renderer(canvas) {
  this.c = new CanvasStack({
    effects: new Canvas(this.renderEffect.bind(this), $(canvas)),
    main: new Canvas(this.renderObject.bind(this), $(canvas)),
    over: new Canvas(this.renderOver.bind(this), $(canvas))
  });
  //Enable for debug
  this.c.over.setEnabled(false);
  this.landscape = new Canvas(this.renderLandscape.bind(this));
  this.ctx = this.c.main.getContext();
  this.canvas = $(canvas);
  this.styler = new Styler($(canvas).getStyles(VIEW_CLASSES));
  $(canvas).removeClass();
  this.doInit = this.init;
  this.toDraw = [];
}

Renderer.prototype = {

  BLOCK: 20,
  OBJ_PAD: 0,
  DRAW_EACH: 0.5,
  FRAMES: 8,
  WAIT_FRAMES: 8,

  stop: function(finishLast) {
    if (!this.updator) return;
    if (finishLast) {
      this.toDraw = this.toDraw.slice(0, 1);
      return;
    }
    clearInterval(this.updator);
    this.updator = null;
    this.toDraw = [];
    //this.doInit = this.init;
    this.canvas.trigger("stop");
  },

  init: function(state) {
    var calcWidth = state.width * this.BLOCK;
    if (calcWidth > screen.width - 200) {
      this.BLOCK = Math.floor((screen.width - 200) / state.width);
    }
    this.width = state.width*this.BLOCK;
    this.height = state.height*this.BLOCK;
    this.c.setSize(this.width, this.height);
    this.landscape.setSize(this.width, this.height);
    this.players = state.players;
    this.doInit = function() {};
    this.canvas.trigger("resized");
  },

  update: function(state) {
    this.doInit(state);
    this.toDraw.push({state: state, frame: this.updator ? 0 : this.FRAMES});
    if (!this.updator) {
      this.updator = setInterval($.proxy(this.doDraw, this), this.DRAW_EACH * 1000 / (this.FRAMES + this.WAIT_FRAMES));
      this.doDraw();
    }
  },

  doDraw: function() {
    if (this.toDraw.length > 0) {
      var frame = this.toDraw[0];
      this.draw(frame.state, frame.frame);
      frame.frame++;
      if (frame.frame >= this.FRAMES+this.WAIT_FRAMES) {
        this.toDraw.shift();
      }
      this.canvas.trigger("render", frame.state);
    }
    else {
      this.stop();
    }
    //else - show 'waiting
  },

  draw: function(state, frame) {
    try {
      if (!state.partial) {
        this.landscape.clear();
        this.landscape.render(state.landscape);
        this.renderAreas(state, this.landscape.getContext());
      }
      this.frame = frame;
      this.framePercent = Math.min(1, (frame+1) / this.FRAMES);
      this.c.clear();
      this.landscape.flush(this.c.main);
      this.c.render(state.objects);
    }
    catch (e) {
      console.error(e);
      this.stop();
      throw e;
    }
  },

  _bounds: function(el, pad) {
    pad = pad || 0;
    var size = (this.BLOCK - pad*2);
    var b = {
      x: el.x * this.BLOCK + pad,
      y: el.y * this.BLOCK + pad,
      width: size,
      height: size
    };
    if (el.movedDx != undefined && this.framePercent < 1) {
      if (el.movedFromX != undefined && this.framePercent < 0.5) {
        var from = this._bounds({x: el.movedFromX, y: el.movedFromY});
        b.x = from.x + el.movedDx * size * this.framePercent;
        b.y = from.y + el.movedDy * size * this.framePercent;
      }
      else {
        b.x = b.x - el.movedDx * size * (1-this.framePercent);
        b.y = b.y - el.movedDy * size * (1-this.framePercent);
      }
    }
    return b;
  },

  _cirBounds: function(el, pad) {
    var b = this._bounds(el, pad);
    b.cx = b.x + b.width/2;
    b.cy = b.y + b.height/2;
    b.radius = Math.min(b.width, b.height)/2;
    return b;
  },

  renderAreas: function(state, ctx) {
    ctx.save();
    $.each(state.players, $.proxy(function(i, pl) {
      if (!pl.area) return;
      var p1 = this._bounds({x: pl.area.x1, y: pl.area.y1});
      var p2 = this._bounds({x: pl.area.x2, y: pl.area.y2});
      this.styler.applyClass(ctx, "player-area player" + parseInt(pl.id));
      ctx.fillRect(p1.x, p1.y, p2.x-p1.x+p2.width, p2.y-p1.y+p2.height);
    }, this));

    ctx.restore();
  },

  renderLandscape: function(el, ctx) {
    var bounds = this._bounds(el);
    var cls = el.type.toLowerCase();
    var drawOverGrass = false;
    switch (el.type) {
      case "Site":
        cls = "player" + parseInt(el.owner);
        this.styler.applyClass(ctx, cls);
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        return;
      case "Tree":
        drawOverGrass = true;
        break;
      case "Grass":
      case "Wall":
        break;
      default:
        throw "Unknown landscape - " + el.type;
    }
    if (drawOverGrass) this._render(ctx, 'grass', bounds);
    this._render(ctx, cls, bounds);
  },

  _render: function(ctx, cls, bounds) {
    if (!this.styler.drawImage(ctx, cls, bounds.x, bounds.y, bounds.width+1, bounds.height+1)) {
      this.styler.applyClass(ctx, cls);
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  },

  renderObject: function(el, ctx) {
    var bounds = this._bounds(el, this.OBJ_PAD);
    var cls = el.type.toLowerCase();

    switch (el.type) {
      case "Sheep":
        if (el.action == "panic") cls = 'scared';
        break;
      case "Dog":
        cls = "player" + parseInt(el.owner);
        break;
      default:
        throw "Unknown type - " + el.type;
    }
    this._render(ctx, cls, bounds);
    if (el.voice) {
      this.styler.applyClass(ctx, el.voice);
      //do bark
      ctx.fillRect(bounds.x+bounds.width, bounds.y-20, 40, 20);
      ctx.strokeRect(bounds.x+bounds.width, bounds.y-20, 40, 20);
      ctx.font = "9";
      ctx.strokeText("WOOF!", bounds.x+bounds.width+3, bounds.y-3);
    }
  },

  renderOver: function(el, ctx) {
    if (el.scared != undefined) {
      //debug
      var t = this._cirBounds(el);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.font = "9 normal";
      ctx.fillRect(t.cx, t.y, t.radius, t.radius);
      ctx.strokeText(el.scared, t.cx+2, t.cy-2);
    }
  },

  renderEffect: function(el, ctx) {
    var r = this._cirBounds(el);
    if (el.action == "panic" || el.action == "indignant") {
      this.styler.applyClass(ctx, "scared");
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, r.radius, 0, 2*Math.PI);
      if (el.action == "panic") ctx.fill(); else ctx.stroke();
    }
    if (el.helpedBy || el.scaredBy) {
      var obj = el.helpedBy || el.scaredBy;
      var t = this._cirBounds(obj);
      this.styler.applyClass(ctx, el.helpedBy ? "helped" : "scared");
      ctx.beginPath();
      ctx.moveTo(r.cx, r.cy);
      ctx.lineTo(t.cx, t.cy);
      ctx.stroke();
    }

    if (el.direction) {
      ctx.save();
      var bounds = this._bounds(el);
      ctx.translate(bounds.x+bounds.width/2, bounds.y+bounds.height/2);
      //ctx.translate(bounds.x, bounds.y);
      switch (el.direction) {
        case "left":
          ctx.rotate(Math.PI);
          break;
        case "up":
          ctx.rotate(-Math.PI / 2);
          break;
        case "down":
          ctx.rotate( Math.PI / 2);
          break;
        case "right":
          break;
      }

      this.styler.applyClass(ctx, "arrow");
      if (el.action == "panic") {
        this.styler.applyClass(ctx, "scared");
      }
      ctx.beginPath();
      var ARROW = 3;
      ctx.moveTo(bounds.width / 2 + ARROW, 0);
      ctx.lineTo(bounds.width / 2, -ARROW);
      ctx.lineTo(bounds.width / 2, ARROW);
      ctx.lineTo(bounds.width / 2 + ARROW, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (el.dogVisibilityArea) {
      ctx.save();
      var cls = "player" + parseInt(el.owner);
      this.styler.applyClass(ctx, cls);
      this.styler.applyClass(ctx, "barking-area");
      $.each(el.dogVisibilityArea, function(i, area) {
        var bounds = this._bounds({x:area.x, y:area.y, movedDx: el.movedDx, movedDy: el.movedDy});
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }.bind(this));
      var r = this._cirBounds(el);
      var circleAt = function (r) {
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, el.dogBarkingRadius * this.BLOCK, 0, 2*Math.PI);
        ctx.stroke();
      }.bind(this);
      this.styler.applyClass(ctx, cls);
      for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <=1; dy++) {
          circleAt({cx:r.cx + dx*this.width, cy:r.cy + dy*this.height});
        }
      }
      ctx.restore();
    }
  }
};

//Auto-render demos
$(function() {
  $(".demo").each(function() {
    $(this).addClass("sheep grass dog wall tree player1 player2 player3 player4 scared barking barking-area arrow");
    var gameViewer = new GameViewer($(this));
    $.getJSON('./replays/' + $(this).attr("data-name") + '.json', function(data) {
      gameViewer.setReplay(data.replay);
      gameViewer.goToFrame(gameViewer.getMinFrame());
    })
  });
});
