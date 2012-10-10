module.exports = {
  Event: {
    Init: "init",             //Argument is a options map
    Landscape: "landscape",   //Argument is a landscape map (array of strings)
    Turn: "turn",             //Argument is array of objects
    Finish: "finish",         //Argument is undefined
    Warning: "warning",       //Argument is object {id: id, warning: warning}
    Error: "anerror"          //Argument is error text
  },
  Landscape: {
    Grass: ".",
    Wall: "#",
    Site1: "1",
    Site2: "2",
    Site3: "3",
    Site4: "4",
    isTraversable: function(landscape) { return landscape != this.Wall},
    isSite: function(landscape) {return [this.Site1, this.Site2, this.Site3, this.Site4].indexOf(landscape) > -1}
  },

  Directions: {
    left: {
      dx: -1,
      dy: 0,
      opposite: "right",
      alternatives: ["up", "down"]
    },
    right: {
      dx: 1,
      dy: 0,
      opposite: "left",
      alternatives: ["down", "up"]
    },
    up: {
      dx: 0,
      dy: -1,
      opposite: "down",
      alternatives: ["right", "left"]
    },
    down: {
      dx: 0,
      dy: 1,
      opposite: "up",
      alternatives: ["left", "right"]
    }
  }
};
