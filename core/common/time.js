module.exports = function(enable) {
  var obj = {
    measure: function(topic) {
      if (!obj.measure.enabled) return;
      var now = new Date();
      if (this._lastDate) {
        var dur = now - this._lastDate;
        console.log("         " + topic + " took " + dur + "ms");
      }
      this._lastDate = new Date();
    }
  };
  obj.measure.enabled = enable;
  return obj.measure.bind(obj);
};
