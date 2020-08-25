
/*
 * Riding the Nashorn: Programming JavaScript on the JVM
 * @author Niko Köbler
 * @link https://www.n-k.de/riding-the-nashorn/
 */
 
var global = this;
var window = this;
var process = {env:{}};

/*
 * Adding some console functions
 */
const console = {};

console._log = function (symbol,args) {
  const sep = ' ';
  let msg = symbol;
  for (let i=0; i < args.length; i++) {
    if (typeof args[i] === 'object') {
      msg += JSON.stringify(args[i]) + sep;
    }
    else {
      msg += args[i].toString() + sep;
    }
  }
  IJ.log(msg);
}
/*
 * 
 */
console.assert = function() {
  if (!arguments[0]) {
    let args = [];
    for (let i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console._log('Assertion failed: ',args);
  }
}

/*
 * 
 */
console.debug = function()  {
  console._log('',arguments);
}

/*
 * 
 */
console.log = function () {
  console._log('',arguments);
};


/*
 * 
 */
console.warn = function()  {
  console._log('⚠ ',arguments);
}

/*
 * 
 */
console.error = function()  {
  console._log('⚠ ',arguments);
}

/*
 * 
 */
console.info = function() {
  console._log('ⓘ ',arguments);
}

/*
 * 
 */
const toArrayJS = (java_array) => Java.from(java_array);

/*
 * Specific Nashorn code for IMAGEJ to Extend ImageWindow
 * 
 * 
 */
 
function setOverlay(renderer,root) {
  const ImageWindow = Java.type('ij.gui.ImageWindow');

  const WindowIJ = Java.extend(ImageWindow);
  let imp = renderer.imp;
  let offscreen = renderer.offscreen;
  let listeners = root.listeners;

  let myWin = new WindowIJ(imp) {
    /*
     * Override mouseMoved(x,y)
     */
    mouseMoved: function(x,y) {
      // Private function
      const triggerTarget = (event_type,id) => {
        let target = listeners[event_type].filter( elt => elt.node.ID === id)[0];
        if (target !== undefined) {
          // Trigger the action `event_type`
          target.callback(target.node);
          // Update drawing
          target.node.draw(renderer);
        }
        return target;
      };
      
      ///////////// MAIN /////////////
      let self = Java.super(myWin);
      let imp = self.getImagePlus();
      
      // Step #1 - Hovering
      let hoverID = offscreen.getProcessor().getf(x,y);
      let target = triggerTarget('mouseover', hoverID);
      if (listeners.activeNode !== undefined && target !== undefined && target.node.ID !== listeners.activeNode.ID ) {
        triggerTarget('mouseout',listeners.activeNode.ID);
      }
      if (listeners.activeNode !== undefined && target === undefined ) {
        triggerTarget('mouseout',listeners.activeNode.ID);
      }
      listeners.activeNode = (target === undefined) ? undefined : target.node;

      // Step #2 - Overlay for (tooltip,etc.)
      let overlay = new Overlay();
      // Draw guides
      overlay.add(new Line(x,0,x,imp.getHeight()));
      overlay.add(new Line(0,y,imp.getWidth(),y));
      // Draw tooltip
      let tw = 100.0;
      let th = 50.0;
      let margin = 10.0;
      let xx = [x,x + margin ,x+ margin,x+tw    ,x+tw    ,x+margin,x+margin];
      let yy = [y,y - margin ,y-th/2.0 ,y-th/2.0,y+th/2.0,y+th/2.0,y+margin];
      // Background...
      let tooltip = new PolygonRoi(new FloatPolygon(xx,yy),Roi.POLYGON);
      tooltip.setFillColor(new java.awt.Color(0,0,0)); // Black
      // Border...
      let border = new PolygonRoi(new FloatPolygon(xx,yy),Roi.POLYGON);
      border.setStrokeWidth(1.0); // Black
      border.setStrokeColor(Color.yellow); // Black
      // Label...
      let font = new java.awt.Font("SansSerif", Font.PLAIN, 12);
      let text = new TextRoi(x+ margin + 10.0, y-22.0, `x= ${x}\ny= ${y}\nID= ${offscreen.getProcessor().getf(x,y)}`, font);
      text.setStrokeColor(Color.white); // Yellow
      
      // Add everything in overlay and display
      overlay.add(tooltip);
      overlay.add(border);
      overlay.add(text);

      imp.setOverlay(overlay);
      // imp.setOverlay(roi, Color.yellow, 1, new Color(0,0,1.0,0.4));
      //IJ.log('Coords ' + x + ' ' + y + ' ' + imp.getWidth() ); //  + this.getImagePlus());

    }
  };
  // Set extended ImageWindow...
  imp.setWindow(myWin);

}



/**
 * Polyfill for Array.findIndex
 */
 
// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    },
    configurable: true,
    writable: true
  });
}



/**
 * Polyfill for log10
 */
Math.log10 = Math.log10 || function(x) {
  return Math.log(x) * Math.LOG10E;
};

/**
 * js-timeout-polyfill
 * @see https://blogs.oracle.com/nashorn/entry/setinterval_and_settimeout_javascript_functions
 */
(function (global) {
    'use strict';

    if (global.setTimeout ||
        global.clearTimeout ||
        global.setInterval ||
        global.clearInterval) {
        return;
    }

    var Timer = global.Java.type('java.util.Timer');

    function toCompatibleNumber(val) {
        switch (typeof val) {
            case 'number':
                break;
            case 'string':
                val = parseInt(val, 10);
                break;
            case 'boolean':
            case 'object':
                val = 0;
                break;

        }
        return val > 0 ? val : 0;
    }

    function setTimerRequest(handler, delay, interval, args) {
        handler = handler || function () {
            };
        delay = toCompatibleNumber(delay);
        interval = toCompatibleNumber(interval);

        var applyHandler = function () {
            handler.apply(this, args);
        };

        /*var runLater = function () {
         Platform.runLater(applyHandler);
         };*/

        var timer;
        if (interval > 0) {
            timer = new Timer('setIntervalRequest', true);
            timer.schedule(applyHandler, delay, interval);
        } else {
            timer = new Timer('setTimeoutRequest', false);
            timer.schedule(applyHandler, delay);
        }

        return timer;
    }

    function clearTimerRequest(timer) {
        timer.cancel();
    }

    /////////////////
    // Set polyfills
    /////////////////
    global.setInterval = function setInterval() {
        var args = Array.prototype.slice.call(arguments);
        var handler = args.shift();
        var ms = args.shift();

        return setTimerRequest(handler, ms, ms, args);
    };

    global.clearInterval = function clearInterval(timer) {
        clearTimerRequest(timer);
    };

    global.setTimeout = function setTimeout() {
        var args = Array.prototype.slice.call(arguments);
        var handler = args.shift();
        var ms = args.shift();

        return setTimerRequest(handler, ms, 0, args);
    };

    global.clearTimeout = function clearTimeout(timer) {
        clearTimerRequest(timer);
    };

    global.setImmediate = function setImmediate() {
        var args = Array.prototype.slice.call(arguments);
        var handler = args.shift();

        return setTimerRequest(handler, 0, 0, args);
    };

    global.clearImmediate = function clearImmediate(timer) {
        clearTimerRequest(timer);
    };

})(this);


/*
 * Polyfills from Mozilla Developer Network
 */

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}




if (!Array.prototype.fill) {
  Object.defineProperty(Array.prototype, 'fill', {
    value: function(value) {

      // Steps 1-2.
      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      var O = Object(this);

      // Steps 3-5.
      var len = O.length >>> 0;

      // Steps 6-7.
      var start = arguments[1];
      var relativeStart = start >> 0;

      // Step 8.
      var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

      // Steps 9-10.
      var end = arguments[2];
      var relativeEnd = end === undefined ?
        len : end >> 0;

      // Step 11.
      var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

      // Step 12.
      while (k < final) {
        O[k] = value;
        k++;
      }

      // Step 13.
      return O;
    }
  });
}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  });
}

// Production steps of ECMA-262, Edition 6, 22.1.2.1
// Référence : https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from
if (!Array.from) {
  Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) { 
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function (value) { 
      var number = Number(value); 
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number)); 
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) { 
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    }; 
  
    // La propriété length de la méthode vaut 1.
    return function from(arrayLike/*, mapFn, thisArg */) { 
      // 1. Soit C, la valeur this
      var C = this;
      
      // 2. Soit items le ToObject(arrayLike).
      var items = Object(arrayLike); 
      
      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) { 
        throw new TypeError("Array.from doit utiliser un objet semblable à un tableau - null ou undefined ne peuvent pas être utilisés");
      }
    
      // 4. Si mapfn est undefined, le mapping sera false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {  
        // 5. sinon      
        // 5. a. si IsCallable(mapfn) est false, on lève une TypeError.
        if (!isCallable(mapFn)) { 
          throw new TypeError('Array.from: lorsqu il est utilisé le deuxième argument doit être une fonction'); 
        }
     
        // 5. b. si thisArg a été fourni, T sera thisArg ; sinon T sera undefined.
        if (arguments.length > 2) { 
          T = arguments[2];
        }
      }
    
      // 10. Soit lenValue pour Get(items, "length").
      // 11. Soit len pour ToLength(lenValue).
      var len = toLength(items.length);  
     
      // 13. Si IsConstructor(C) vaut true, alors
      // 13. a. Soit A le résultat de l'appel à la méthode interne [[Construct]] avec une liste en argument qui contient l'élément len.
      // 14. a. Sinon, soit A le résultat de ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);
   
      // 16. Soit k égal à 0.
      var k = 0;  // 17. On répète tant que k < len… 
      var kValue;
      while (k < len) {
        kValue = items[k]; 
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k); 
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Soit putStatus égal à Put(A, "length", len, true).
      A.length = len;  // 20. On renvoie A.
      return A;
    };
  }());
}

