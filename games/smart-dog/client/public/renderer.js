//TODO: introduce style selector on page


function Canvas(renderer, canvas) {
  if (!canvas) {
    canvas = $("<canvas></canvas>").hide().appendTo($("body"));
  }
  this.canvas = canvas;
  this.ctx = canvas[0].getContext("2d");
  this.renderer = renderer;
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

  render: function(el, el_if_first_is_index) {
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
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  flush: function(mainCtx) {
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
    main: new Canvas(this.renderObject.bind(this), $(canvas))
  });
  this.landscape = new Canvas(this.renderLandscape.bind(this));
  this.ctx = this.c.main.getContext();
  this.canvas = $(canvas);
  this.styler = new Styler($(canvas).getStyles());
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

  stop: function() {
    clearInterval(this.updator);
    this.updator = null;
    this.toDraw = [];
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

  renderLandscape: function(el, ctx) {
    var bounds = this._bounds(el);
    var cls = el.type.toLowerCase();
    switch (el.type) {
      case "Site":
        cls = "player" + parseInt(el.owner);
        this.styler.applyClass(ctx, cls);
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        return;
      case "Grass":
      case "Wall":
      case "Tree":
        break;
      default:
        throw "Unknown landscape - " + el.type;
    }
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
        if (el.scary) cls = 'scary';
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

  renderEffect: function(el, ctx) {
    if (el.scary) {
      //TODO: styles
      ctx.fillStyle = "red";
      ctx.strokeStyle = "red";
      var r = this._cirBounds(el);
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, r.radius, 0, 2*Math.PI);
      ctx.fill();
      if (el.scaredBy) {
        var t = this._cirBounds({x:el.scaredBy.x, y:el.scaredBy.y});
        ctx.beginPath();
        ctx.moveTo(r.cx, r.cy);
        ctx.lineTo(t.cx, t.cy);
        ctx.stroke();
      }
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
      if (el.scary) {
        this.styler.applyClass(ctx, "scary");
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
    if (el.sheepBarkingArea) {
      ctx.save();
      var cls = "player" + parseInt(el.owner);
      this.styler.applyClass(ctx, cls);
      this.styler.applyClass(ctx, "barking-area");
      $.each(el.sheepBarkingArea, function(i, area) {
        var bounds = this._bounds({x:area.x, y:area.y, movedDx: el.movedDx, movedDy: el.movedDy});
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }.bind(this));
      var r = this._cirBounds(el);
      var circleAt = function (r) {
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, el.sheepBarkingRadius * this.BLOCK, 0, 2*Math.PI);
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