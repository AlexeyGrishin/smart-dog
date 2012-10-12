var Map2D = require('./map2d.js');
/*
  var $ = require('./modules.js')(game);

  $(object)   -> HelperObject
  $()         -> HelperObjectCollection (all)
  $.all       -> HelperObjectCollection (all)
  $(map)      -> HelperMap
  $           -> HelperMap
  $(selector) -> HelperObjectCollection

    selector
      .Sheep    // by type or landscape
      .landscape
      :scared    // by boolean attribute

 HelperObjectCollection
  find(selector)  -> HelperObjectCollection
  around(object, radius) -> HelperObjectCollection
  hasAround(selector, radius) -> true/false
  contains(selector_or_object) -> true/false
  at(x, y)        -> HelperObjectCollection

 HelperObject
  around(radius)  -> HelperObjectCollection
  distance2(o2)   -> distance2
  inRadius(o2, radius)  -> true/false
  direction(o2)   -> {dx: -1|0|1, dy:-1|0|1}


 HelperMap
  find(selector)  -> HelperObjectCollection
  around(object, radius) -> HelperObjectCollection
  distance2(o1, o2)  -> distance2
  direction(o1, o2)  -> {dx: -1|0|1, dy:-1|0|1}
  inRadius(o1, o2, radius) -> true/false
  at(x, y)        -> HelperObjectCollection

  $.moduleName = $.extend($, {extendMap: function(map), extendClass: function(classCtor, p), selector: function(selector), extendCollection});
  $.extend(GameObjectClass, $.moduleName, $.moduleName2);

  $.customMethod()   -> called for map
  $(object).customMethod()      -> called for object

 */
function helper(map) {

  if (!(map instanceof Map2D)) {
    if (map.map instanceof Map2D) {
      map = map.map;
    }
    else {
      throw new Error("map shall be instance of Map2D or have field called 'map' instance of Map2D")
    }
  }
  var _cache = {};

  var mainFunc = function(arg) {
    if (arg == undefined || arg instanceof Map2D || (arg.map instanceof Map2D)) {
      return mainFunc;
    }
    if (Array.isArray(arg)) {
      return helperMapCollection(mainFunc, arg);
    }
    if (typeof arg == 'string') {
      return mainFunc.find(arg);
    }
    if (arg.id) {
      var helper = _cache[arg.id];
      if (!helper) {
        helper = helperObject(mainFunc, arg);
        _cache[arg.id] = helper;
      }
      return helper;
    }
    throw new Error("Unknown object - is not a map, not a collection, not a game object, not a selector");
  };
  mainFunc.extend = function(obj, module, p, moduleOptions) {
    if (obj == mainFunc) {
      module.extendMap(mainFunc, map);
      //extend self
      return module;
    }
    module.extendObject(mainFunc, obj, p, moduleOptions);
  };

  mainFunc.distance2 = function(o1, o2) {
    return map.distance2(o1.x, o1.y, o2.x, o2.y);
  };
  mainFunc.inRadius = function(o1, o2, radius) {
    return mainFunc.distance2(o1, o2) <= radius*radius;
  };
  mainFunc.__defineGetter__('all', function() {
    if (this._all) return this._all;
    this._all = helperMapCollection(mainFunc, map.allObjects);
    return this._all;
  });
  mainFunc.find = function(selector) {
    return mainFunc.all.find(selector);
  };
  mainFunc.around = function(object, radius) {
    return helperMapCollection(mainFunc, map.getAround("all", object.x, object.y, radius));
  };
  mainFunc.at = function(x, y) {
    return helperMapCollection(mainFunc, map.getAllAt(x, y));
  };
  mainFunc.direction = function(o1, o2) {
    return map.getDirection(o1.x, o1.y, o2.x, o2.y);
  };
  mainFunc.free = function() {
    _cache = null;
    mainFunc = null;
    map = null;
  };


  return mainFunc;

}

function helperObject(helperMap, obj) {
  return {
    getObject: function() {return obj;},
    distance2: function(o2) {
      return helperMap.distance2(obj, o2);
    },
    around: function(radius) {
      return helperMap.around(obj, radius)
    },
    inRadius: function(obj_or_collection, radius) {
      return helperMap(obj_or_collection).hasAround(obj, radius);
    },
    hasAround: function(object, radius) {
      return helperMap.inRadius(object, obj, radius);
    },
    is: function(selectr) {
      return selector(selectr)(obj);
    },
    contains: function(object_or_selector) {
      if (typeof object_or_selector == 'string') {
        return selector(object_or_selector)(obj);
      }
      return obj == object_or_selector;
    },
    direction: function(o2) {
      return helperMap.direction(obj, o2);
    }
  }
}


var Selectors = {
  byType: function(type, object) {return object.type == type || object.landscape == type;},
  byBoolean: function(prop, object) {return object[prop] === true}
};

function selector(selectr) {
  var filters = selectr.split(" ").map(function(selectr) {
    if (selectr[0] == '.') return Selectors.byType.bind(null, selectr.substring(1));
    if (selectr[0] == ':') return Selectors.byBoolean.bind(null, selectr.substring(1));
    throw new Error("Unknown selector - " + selectr);
  });
  return function(o) {
    return filters.every(function(f) {return f(o);});
  }
}

function find(objects, selectr) {
  return objects.filter(selector(selectr));
}

function helperMapCollection(helperMap, objs) {
  var collection = objs.slice();
  collection.find = function(selector) {
    return helperMapCollection(helperMap, find(collection, selector));
  };
  collection.around = function(object, radius) {
    return helperMapCollection(helperMap, collection.filter(function(o) {
      return helperMap.inRadius(o, object, radius);
    }));
  };
  collection.contains = function(object_or_selector) {
    if (typeof object_or_selector == 'string') {
      return collection.some(selector(object_or_selector));
    }
    return collection.some(function(o) {return o == object_or_selector});
  };
  collection.not = function(object) {
    return helperMapCollection(helperMap, collection.filter(function(o) {
      return o != object;
    }));
  };
  collection.is = function(selectr) {
    return collection.every(selector(selectr));
  };
  collection.hasAround = function(object, radius) {
    return collection.some(function(o) {
      return helperMap.inRadius(object, o, radius);
    })
  };
  collection.first = function() {
    return collection.length > 0 ? collection[0] : null;
  };
  collection.at = function(x, y) {
    return helperMapCollection(helperMap, collection.filter(function(o) {
      return o.x == x && o.y == y;
    }));
  };

  return collection;
}

module.exports = helper;
