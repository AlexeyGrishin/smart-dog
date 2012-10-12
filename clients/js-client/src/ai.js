//Uses landscape from bot.js

var AI = {
  turn: function(dogs, sheeps, enemyDogs, barkingInvisible, landscape) {
    this.sheepDog(dogs.shift(), sheeps, landscape);
    dogs.forEach(function(d) { this.attackingDog(d, sheeps, enemyDogs.concat(barkingInvisible), landscape)}.bind(this));
  },

  sheepDog: function (dog, sheeps, landscape) {
    var sheepsNonOnPlace = landscape.sortByDistance(dog, sheeps.filter(function(s) { return !landscape.isMySite(s.x, s.y) }));
    sheepsNonOnPlace.some(function(nearestSheep) {
      var nearestSite = landscape.findNearest(nearestSheep, function(l){
        return landscape.isMySite(l.x, l.y)
      });
      var requiredDirection = landscape.direction(nearestSheep, nearestSite);
      var barkingDirection = landscape.direction(dog, nearestSheep);
      if (barkingDirection == requiredDirection && landscape.canBarkOn(dog, nearestSheep)) {
        dog.bark();
      }
      else {
        var requiredLocationToBark = landscape.at(nearestSheep, landscape.oppositeDirection(requiredDirection));
        if (landscape.isTraversable(requiredLocationToBark.x, requiredLocationToBark.y)) {
          this.moveTo(landscape, dog, requiredLocationToBark);
        }
        else {
          //skip this sheep
          return false;
        }
      }
      return true;
    }.bind(this));
  },

  moveTo: function(landscape, dog, target) {
    var way = landscape.findWay(dog, target);
    if (way.length > 0) {
      dog.move(way[0]);
    }
    else {
      //
      dog.bark();
    }
  },

  attackingDog: function (dog, sheeps, enemyDogs, landscape) {
    var sheepsOnEnemySite = sheeps.filter(function(s) {return landscape.isEnemySite(s.x, s.y)});
    var shallBark = sheepsOnEnemySite.some(landscape.canBarkOn.bind(landscape, dog));
    if (!shallBark) {
      shallBark = enemyDogs.some(landscape.canBarkOn.bind(landscape, dog));
    }
    if (shallBark) dog.bark();
    var nearestTarget = landscape.findNearestObject(dog, sheepsOnEnemySite.concat(enemyDogs));
    if (!nearestTarget) nearestTarget = landscape.findNearest(dog, function(s) {return landscape.isEnemySite(s.x, s.y)});
    this.moveTo(landscape, dog, nearestTarget);
  }

};



module.exports = AI;
