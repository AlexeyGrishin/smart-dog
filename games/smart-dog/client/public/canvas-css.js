
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

var Styler = function(styles) {
  this.styles = styles;
};

Styler.prototype = {
  applyClass: function(ctx, classes) {
    $.each(classes.split(/\s+/), $.proxy(function(i, cls) {
      var style = this.styles[cls];
      if (style) {
        if (style.color) ctx.strokeStyle = style.color;
        if (style.bgColor) ctx.fillStyle = style.bgColor;
        if (style.opacity) ctx.globalAlpha = style.opacity;
      }
    }, this));
  },

  drawImage: function(ctx, cls) {
    var style = this.styles[cls];
    if (style && style.bgImage) {
      var args = Array.prototype.slice.call(arguments).slice(2);
      args.unshift(style.bgImage);
      ctx.drawImage.apply(ctx, args);
      return true;
    }
    return false;
  }
};


$.fn.getStyles = function(classList) {
  var div = $("<div></div>").appendTo($("body"));
  var styles = {};
  var defaultStyle = {
    color: div.css('color'),
    bgColor: div.css('backgroundColor')
  };
  classList = classList || this[0].className.split(/\s+/);
  setTimeout(function() {
    $.each(classList, function(i, cls) {
      div.addClass(cls);
      var stl = {};
      styles[cls] = stl;
      if (defaultStyle.color != div.css('color')) stl.color = div.css('color');
      if (defaultStyle.bgColor != div.css('backgroundColor')) stl.bgColor = div.css('backgroundColor');
      if (div.css('opacity') != "1") stl.opacity = parseFloat(div.css('opacity'));

      var bgImage = div.backgroundImageUrl();
      if (bgImage) {
        var img = new Image();
        img.src = bgImage;
        styles[cls].bgImage = img;
      }
      div.removeClass(cls);
    });
  }, 0);
  return styles;
};
