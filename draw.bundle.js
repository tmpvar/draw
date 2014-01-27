;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var Vec2 = require('vec2');
var Polygon = require('polygon');
var segseg = require('segseg');
/*

  BUGS:
    * last line segment in poly is not tracked for snapping

  TODO: 

    * Snapping
      * Helpers
        * Endpoints lines
        * Midpoints lines
      * Dragging
        * angular snaps


    * modes
      * selection mode by default
      * line mode until <esc> out of it

    * Add points to existing geometry
      * compute circle -> line intersection much like existing point check
      * handle click and add point where isect or closest occurs
    
    * Dimensioning
      * Bind to point's change
      * Apply input'd dimension to points
        ( this may require having a fixed end or dealing with recursion )
    
    * Relationships
      * coincident
      * parallel
*/



var term = function(val) {
  var li = document.createElement('li');
  li.innerHTML = val;
  document.getElementById('terminal').appendChild(li);
}

var frameQueued = false;
var queueFrame = function() {
  if (!frameQueued) {
    frameQueued = true;
    requestAnimationFrame(function(time) {
      frameQueued = false;
      render(time);
    });
  }
}

queueFrame();

var mouse = Vec2(0, 0);
var intersectionThreshold = 15;
var angularThreshold = 5;
var offsetAmount = -20;
//<!--
var TAU = Math.PI*2;
var highlighted = null, hovering = null, hoveringMeta;
var rgba = function(array) {
  return 'rgba(' + array.join(',') + ')';
};

var fromRgba = function(string) {
  return string
          .replace(/[^\(]+/, '')
          .replace(')', '')
          .replace(/ /g, '').split(',');
}

function Point(x, y, color) {
  Vec2.call(this, x, y);
  this.color = [0, 255, 0, .2]
}
Point.prototype = new Vec2();

Point.prototype.width = 3;
Point.prototype.color = null;

Point.prototype.render = function(diff) {
  ctx.fillStyle = rgba(this.color);
  var stroke = this.color.slice();
  stroke[3] += .1;
  ctx.strokeStyle = rgba(stroke);

  if (hovering === this) {
    ctx.beginPath();
      ctx.arc(this.x, this.y, this.width*2.5, TAU, false);
    ctx.closePath();
  } else {
    ctx.beginPath();
     ctx.arc(this.x, this.y, this.width, TAU, false);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.fill();
}

Point.prototype.isAutoCentering = false
Point.prototype.autoCenter = function(start, end) {
  this.isAutoCentering = [start, end];
  var handler = function() {
    var n = end.subtract(start, true).divide(2).add(start);
    this.set(n.x, n.y);
  }.bind(this);    

  start.change(handler);
  end.change(handler);
};


function TrackingMode(target) {
  this.point = target;
};

Point.relationshipModes = {
  center : function(start, end) {
    var change = function() {
      var diff = end.subtract(start, true).add(end);
      this.set(diff.x, diff.y);
    }

    this.trackingMode = { name : "center", start: start, end: end };

    start.change(change.bind(this));
    end.change(change.bind(this));
  },

  along : function(point, start, end) {

    this.trackingMode = {
      name : "percent",
      start: start,
      end: end
    };

  },

  on : function(start, end) {
    // TODO: coincident means either exacl
    this.trackingMode = {
      name : "on",
      start: start,
      end: end
    };

    point.change(function() {
      if (!end) {
        this.set(point.x, point.y);
      } else {
        var diff = end.subtract(start, true);
        var length = diff.length();
        diff.normalize();

        diff.multiply(length*percent).add(start);
        this.set(diff.x, diff.y);
      }
    }.bind(this));
  }
}

var lastTick = 0;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var points = [];

var paths = [
 // [
/*    new Point(-44,-171.5),
    new Point(-52,-71.5),
    new Point(-109.00791,-92.944138),
    new Point(-109.00791,-20.529813),
    new Point(-18,-33.5),
    new Point(-42.000035,46.568672),
    new Point(24.943186,46.568672),
    new Point(26,-45.5),
    new Point(99,-20.5),
    new Point(99,-88.5),
    new Point(26,-90.5),
    new Point(27.007042,-171.5),
*/
  //]
];

var scale = 1;
var translation = { x : 0, y: 0 };
var fixMouse = function(e) {
  return {
    x : (e.x - canvas.width/2)/scale + translation.x/scale,
    y : (e.y - canvas.height/2)/scale + translation.y/scale
  };
}

var lines = function(array, wrap, fn) {
  for (var i=0; i<array.length; i++) {

    var next = null;
    if (i===array.length-1) {
      if (wrap) {
       next = array[0];
      }
    } else {
      next = array[i+1];
    }

    fn(array[i], next, i);
  } 
}    

var states = {};
var renderHelpers = null; 
var closestLine = function() {
  var closest = null;
  renderHelpers = null;
  states = {};
  hovering = null;
  hoveringMeta = null;
  paths.concat([points]).forEach(function(path, idx) {
    lines(path, true, function(start, end, i) {
      if (!end || end === activePoint || start === activePoint) {
        return;
      }

      if (mouse.distance(start) < intersectionThreshold) {
        hovering = start;
        hoveringMeta = { array: path, index: i };
      }

      if (mouse.distance(end) < intersectionThreshold) {
        hovering = end;
        hoveringMeta = { array: path, index: i };
      }


      var d = end.subtract(start, true);
      var f = start.subtract(mouse, true);
      var r = intersectionThreshold;
      var a = d.dot(d);
      var b = 2*f.dot(d);
      var c = f.dot(f) - r*r;

      var disc = b*b-4*a*c;
      if (disc > 0) {
        disc = Math.sqrt(disc);

        var t1 = (-b - disc)/(2*a);
        var t2 = (-b + disc)/(2*a);
        var use = null;
        
        if (t1 >=0 && t1 <= 1 && t2>=0 && t2<=1) {
          use = Math.abs(t1-t2)/2 + t1;

        } else if (t1 >= 0 && t1 <= 1) {
          use = t1;
        } else if (t2 >= 0 && t2 <= 1) {
          use = t2;
        }


        if (use) {
          var snapCenter = Math.abs(use - .5) < .1;
          var dn = d.clone();
          dn.normalize();
          var dnc = dn.clone();
          if (snapCenter) {
            use = .5;
            states.center = dn;
            states.center.start = start;
            states.center.end = end;
            states.edge = null;
          } else {
            states.center = null;
            states.edge = dn;
          }
          dn.multiply(d.length() * use);
          dn.add(start);

          renderHelpers = function(time) {
            ctx.save();
              ctx.beginPath();
              ctx.translate(dn.x, dn.y);
              ctx.arc(0, 0, 5, TAU, false);
              ctx.strokeStyle = "rgba(0,255,0, .2)";
              ctx.stroke();
            ctx.restore();

            if (Math.abs(use - .5) < .1) {
              ctx.save();
                ctx.beginPath();
                var center = dnc.multiply(d.length() * .5, true).add(start);
                ctx.translate(center.x, center.y);
                ctx.fillStyle = "orange";
                ctx.rotate(TAU/4);
                ctx.arc(0, 0, 5, TAU, false);
                ctx.fill();
              ctx.restore();
            }
          }
        }
      }
    });
  });
}


var qel = function(selector) {
  return document.querySelector(selector);
}

Point.trackingModes = {
  center : function(start, end) {
    var change = function() {
      var diff = end.subtract(start, true).add(end);
      this.set(diff.x, diff.y);
    }

    start.change(change.bind(this));
    end.change(change.bind(this));
  },

  percent : function(start, end, percent) {
    this.change(function() {
      var diff = end.subtract(start, true);
      var length = diff.length();
      diff.normalize();

      diff.multiply(length*percent).add(start);
      this.set(diff.x, diff.y);
    }.bind(this));
  },

  same : function(point) {
    point.change(function() {
      this.set(point.x, point.y);
    }.bind(this));
  }

}

var activePoint = null, dragging = null;
canvas.addEventListener('mousedown', function(e) {
  queueFrame();
  if (hovering) {
    dragging = hovering;
  }
});

canvas.addEventListener('mouseup', function(e) {
  queueFrame();
  if (activePoint && hovering && (!highlighted || !highlighted.isAutoCentering)) {
    activePoint = hovering;
    highlighted = null;  
  }

  if ((!hovering && !highlighted) || activePoint) {
     e = fixMouse(e);
     if (states.center) {
       var centerPoint = new Point(states.center.x, states.center.y)
       centerPoint.autoCenter(states.center.start, states.center.end);
       points.push(centerPoint);
       activePoint = new Point(e.x, e.y);
       states.center = null;
     } else if (states.edge) {

       var edgePoint = new Point(states.edge.x, states.edge.y);
      
       //edgePoint.autoTrack(states.edge.start, states.edge.end, states.edge.

       points.push(edgePoint);
       activePoint = new Point(e.x, e.y);
       states.edge = null;
     } else {
       if (activePoint) {
         points.push(activePoint);
       } else {
         points.push(new Point(e.x, e.y));
       }
       activePoint = new Point(e.x, e.y);
     }
   } else if (hovering) {
     if (!highlighted || !highlighted.isAutoCentering) {
       dragging = hovering;
       hovering = null;
     }
   } 

  if (dragging) {
    dragging = null;
  }
});

canvas.addEventListener('mousemove', function(e) {
  var clean = fixMouse(e);
  mouse.set(clean.x, clean.y);
  mouse.raw = Vec2(e.x, e.y);

  closestLine();
  queueFrame();

  if (activePoint) {
    activePoint.set(clean.x, clean.y); 
  } else if (dragging) {
    dragging.set(clean.x, clean.y);
  }

});

qel('#command').addEventListener('keydown', function(e) {
  if (e.keyCode === 13) {
    term(qel('#command').value);
    qel('#command').value = ''; 
    e.stopPropagation();
    qel('#status').style.display = 'none';
  }
});

document.addEventListener('keydown', function(e) {
  switch (e.keyCode) {
    case 27: // escape
    case 81:
      if (document.getElementById('status').style.display === 'block') {
        document.getElementById('status').style.display = 'none';
        return;
      }

      if (points.length > 1) {
        paths.push(points);
      }

      points = [];
      activePoint = null;
      queueFrame();
    break;

    case 186:

      if (e.shiftKey) {
        document.getElementById('status').style.display = 'block'
        document.querySelector('#status input').focus();
        e.preventDefault();
      }

    break;
  }
});

var el = document.createElement('span');
el.innerHTML = '&deg;';
var degreeSymbol = el.innerText;

var fixed = function(f, length) {
  var num = Number(f).toFixed(length || 2);
  if (num.indexOf('.') < 0) {
    num += '.';
    for (var i = 0; i< length; i++) {
      num+='0';
    }
  }
  return num;
};

var toTAU = function(val) {
  if (val < 0) {
    return val + TAU;
  }
  return TAU;
};

var near = function(a, b, threshold) {
  a = Math.abs(a);
  if (a-b < threshold && a-b > -threshold) {
    return true;
  }
};

var renderDegrees = function(point, radsFromZero, rads) { 
  var degs = Math.abs(rads *(360/TAU));
  
  // render degrees
  ctx.beginPath();

    ctx.save();
      ctx.translate(point.x, point.y);
      ctx.beginPath();
      var radius = 20/scale; 
        rads < 0 ? ctx.rotate(radsFromZero) : ctx.rotate(radsFromZero + rads);;
        ctx.arc(0, 0, radius, (rads < 0) ? rads : -rads, false);
        ctx.lineTo(0, 0);

      ctx.closePath();
               
      ctx.strokeStyle = "rgba(0, 255, 0, .2)";
      ctx.fillStyle = "rgba(0, 255, 0, .05)";
      ctx.stroke();
      ctx.fill();
    ctx.restore();
    ctx.save();
      ctx.beginPath();
        var bisector = Vec2(radius * 3/scale, 0).rotate(radsFromZero + rads/2 + Math.PI); 
        ctx.translate(point.x, point.y);
        
        ctx.moveTo(0, 0);
        ctx.lineTo(bisector.x, bisector.y);
        ctx.stroke();
        
        ctx.translate(bisector.x, bisector.y);

        ctx.fillStyle="rgba(0, 255, 0, .7)";
        ctx.font = (12/scale) + 'px sans-serif';
        var text = fixed(degs, 1) + degreeSymbol;
        var textWidth = ctx.measureText(text).width;
        ctx.fillText(text, 5/scale, -6/scale);

        ctx.moveTo(0, 0);
        ctx.lineTo(textWidth+5/scale, 0);
        ctx.stroke();

    ctx.restore();
  ctx.closePath();
}

var lineRadsFromZero = function(start, end) {
    return Vec2(1, 0).angleTo(end.subtract(start, true).normalize());
};

var lineIntersectionRads = function(start, shared, end) { 
  var pointVec = start.subtract(shared, true).normalize();
  var activeVec = end.subtract(shared, true).normalize();
  return activeVec.angleTo(pointVec);
};

function render(time) {
  canvas.width = 0;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.fillStyle = "#333335"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 1/scale;
  ctx.save();
  ctx.translate( canvas.width/2 - translation.x, canvas.height/2 - translation.y);
  ctx.scale(scale, scale);

  var delta = time-lastTick;
  lastTick = time;

  var trackingPoint = activePoint || dragging || null;

  if (trackingPoint) {
    var rads = false, radsFromZero, lastPoint;
   

    if (activePoint) {
      lastPoint = points[points.length-1];
      var prevPoint = (points.length > 2) ? points[points.length-2] : Vec2(100, lastPoint.y);
      var activeVec = mouse.subtract(lastPoint, true).normalize();
      var pointVec = prevPoint.subtract(lastPoint, true).normalize();
      
      rads = pointVec.angleTo(activeVec);   
      radsFromZero = lineRadsFromZero(lastPoint, prevPoint);
    } else if (hoveringMeta) {
      var tpoly = Polygon(hoveringMeta.array);
      lastPoint = tpoly.point(hoveringMeta.index-1);
      var n = tpoly.point(hoveringMeta.index+1);

      radsFromZero = lineRadsFromZero(trackingPoint, lastPoint),
      rads2 = trackingPoint.subtract(lastPoint, true).normalize().angleTo(
        n.subtract(trackingPoint, true).normalize()
      );
      console.log(rads2, hoveringMeta.index);

    }

    if (rads !== false) {
      var angularThreshold = TAU/32;
      var snapAngles = TAU/8;

      var snapDiv = (rads/snapAngles);
      var snapMod = snapDiv%1;
      var snapRound = Math.round(snapDiv) * snapAngles;

      if (
        near((snapMod)*snapAngles, snapAngles, angularThreshold) ||
        near((1-snapMod)*snapAngles, snapAngles, angularThreshold)
      ) {
        var activeLength = trackingPoint.subtract(lastPoint).length();
        trackingPoint.set(activeLength, 0);
        
        rads = snapRound;
        trackingPoint.rotate(radsFromZero);
        trackingPoint.rotate(rads);
        trackingPoint.add(lastPoint);
      }

      trackingPoint.render(delta);
      
      renderDegrees(lastPoint || trackingPoint, radsFromZero, rads);
    }
  }

  if (dragging) {
  //  console.log('dragging', dragging);
  }


  paths.forEach(function(points) {
    ctx.beginPath();
      points.forEach(function(point) {
        ctx.lineTo(point.x, point.y);
      });
    ctx.closePath();

    ctx.strokeStyle = "#888";
    ctx.fillStyle = 'rgba(0, 0, 0, .2)';

    if (!activePoint && ctx.isPointInPath(mouse.rawX, mouse.rawY)) {
      ctx.fillStyle = "rgba(0, 0, 0, .5)";
      ctx.strokeStyle = '#999';
    }

    ctx.fill();
    ctx.stroke();

    Polygon(points).each(function(p, c, n) {

      if (hovering === c) {
        // TODO: move things like this into the point helpers   
        renderDegrees(
          c,
          lineRadsFromZero(c, p),
          c.subtract(p, true).normalize().angleTo(c.subtract(n, true).normalize())
        );
      }

      c.render && c.render();
    });

    var poly = Polygon(points).rewind(true).dedupe();
    if (poly.length > 2) {
      try {
        var offset = poly.offset(offsetAmount);
      } catch (e) {
        console.log(e.stack);
        return;
      }
    
      var idx = 0;
      ctx.beginPath();
      offset.each(function(p, c, n) {
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(c.x, c.y);
        ctx.fillText(idx++, p.x + 10, p.y);
      });

      ctx.closePath();
      ctx.strokeStyle = '#f0f';
      ctx.stroke();

      ctx.strokeStyle = "red";
      offset.each(function(p, c) {
        ctx.beginPath();
        ctx.moveTo(c.point.x, c.point.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      });

      var colors =  ['#f00', '#0f0', '#00f', 'yellow', 'orange'];

      var pruned = offset.pruneSelfIntersections();
      pruned.forEach(function(poly) {
        ctx.fillStyle = ctx.strokeStyle = colors.shift();

        ctx.beginPath();
        ctx.moveTo(poly.points[0].x, poly.points[0].y)

        poly.each(function(p, c, n) {
          ctx.lineTo(c.x, c.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      });
    }
  });
  

  ctx.strokeStyle = "#ccc";    
  ctx.beginPath();
  points.forEach(function(point) {
    ctx.lineTo(point.x, point.y);
  });

  activePoint && ctx.lineTo(activePoint.x, activePoint.y);
 
  ctx.stroke();

  points.forEach(function(point) {
    point.render(delta);
  });

  ctx.restore();

  ctx.translate(canvas.width/2 - translation.x, canvas.height/2 - translation.y);
  ctx.strokeStyle = "red";
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();

  ctx.strokeStyle = "blue";
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 10);
  ctx.stroke();

  renderHelpers && renderHelpers();
};

},{"polygon":2,"segseg":3,"vec2":4}],2:[function(require,module,exports){
var Vec2 = require('vec2');
var segseg = require('segseg');
var PI = Math.PI;
var TAU = PI*2;
var toTAU = function(rads) {
  if (rads<0) {
    rads += TAU;
  }

  return rads;
};


function Polygon(points) {
  if (points instanceof Polygon) {
    return points;
  }

  if (!(this instanceof Polygon)) {
    return new Polygon(points);
  }

  if (!Array.isArray(points)) {
    points = (points) ? [points] : [];
  }

  this.points = points.map(function(point) {
    if (Array.isArray(point)) {
      return Vec2.fromArray(point);
    } else if (!(point instanceof Vec2)) {
      if (typeof point.x !== 'undefined' &&
          typeof point.y !== 'undefined')
      {
        return Vec2(point.x, point.y);
      }
    } else {
      return point;
    }
  });
}

Polygon.prototype = {
  each : function(fn) {
    for (var i = 0; i<this.points.length; i++) {
      if (fn.call(this, this.point(i-1), this.point(i), this.point(i+1), i) === false) {
        break;
      }
    }
    return this;
  },

  point : function(idx) {
    var el = idx%(this.points.length);
    if (el<0) {
      el = this.points.length + el;
    }

    return this.points[el];
  },

  dedupe : function(returnNew) {
    var seen = {};
    // TODO: make this a tree
    var points = this.points.filter(function(a) {
      var key = a.x + ':' + a.y;
      if (!seen[key]) {
        seen[key] = true;
        return true;
      }
    });

    if (returnNew) {
      return new Polygon(points);
    } else {
      this.points = points;
      return this;
    }
  },

  remove : function(vec) {
    this.points = this.points.filter(function(point) {
      return point!==vec;
    });
    return this;
  },

  // Remove identical points occurring one after the other
  clean : function(returnNew) {
    var last = this.point(-1);

    var points = this.points.filter(function(a) {
      var ret = false;
      if (!last.equal(a)) {
        ret = true;
      }

      last = a;
      return ret;
    });

    if (returnNew) {
      return new Polygon(points);
    } else {
      this.points = points
      return this;
    }
  },

  winding : function() {
    return this.area() > 0;
  },

  rewind : function(cw) {
    cw = !!cw;
    var winding = this.winding();
    if (winding !== cw) {
      this.points.reverse();
    }
    return this;
  },

  area : function() {
    var area = 0;
    var first = this.point(0);

    this.each(function(prev, current, next, idx) {
      if (idx<2) { return; }

      var edge1 = first.subtract(current, true);
      var edge2 = first.subtract(prev, true);
      area += ((edge1.x * edge2.y) - (edge1.y * edge2.x));
    });

    return area/2;
  },

  closestPointTo : function(vec) {
    var points = [];

    this.each(function(prev, current, next) {
      // TODO: optimize
      var a = prev;
      var b = current;
      var ab = b.subtract(a, true);
      var veca = vec.subtract(a, true);
      var vecadot = veca.clone().dot(ab);
      var abdot = ab.clone().dot(ab);

      var t = vecadot/abdot;

      if (t<0) {
        t = 0;
      }

      if (t>1) {
        t = 1;
      }

      var point = ab.multiply(t, true).add(a);

      points.push({
        distance: point.distance(vec),
        point : point
      });
    });

    var obj = points.sort(function(a, b) {
      return a.distance-b.distance;
    })[0];

    var point = obj.point;
    point.distanceToCurrent = obj.distance;

    this.each(function(prev, current, next) {
      if (point.equal(current)) {
        point.current = current;
        point.prev = prev;
        point.next = next;
        return false;
      }
    });

    return point;
  },

  center : function() {
    // TODO: the center of a polygon is not the center of it's aabb.
    var aabb = this.aabb();
    return Vec2(aabb.x + aabb.w/2, aabb.y + aabb.h/2);
  },

  scale : function(amount, origin, returnTrue) {
    var obj = this;
    if (returnTrue) {
      obj = this.clone();
    }

    if (!origin) {
      origin = obj.center();
    }

    obj.each(function(p, c) {
      c.multiply(amount);
    });

    var originDiff = origin.multiply(amount, true).subtract(origin);

    obj.each(function(p, c) {
      c.subtract(originDiff);
    });

    return obj;
  },

  containsPoint : function(point) {
    var type=0,
        left = Vec2(this.aabb().x, point.y + .00001),
        seen = {};

    this.each(function(prev, current, next) {
      var i = segseg(left, point, current, next);
      if (i && i!==true) {
        type++;
      }
    });

    return type%2 === 1;
  },

  containsPolygon : function(subject) {
    var ret = true, that = this;
    subject.each(function(p, c, n) {
      if (!that.containsPoint(c)) {
        ret = false;
        return false;
      }
    });
    return ret;
  },


  aabb : function() {
    if (this.points.length<2) {
      return { x: 0, y : 0, w: 0, h: 0};
    }

    var xmin, xmax, ymax, ymin, point1 = this.point(1);

    xmax = xmin = point1.x;
    ymax = ymin = point1.y;

    this.each(function(p, c) {
      if (c.x > xmax) {
        xmax = c.x;
      }

      if (c.x < xmin) {
        xmin = c.x;
      }

      if (c.y > ymax) {
        ymax = c.y;
      }

      if (c.y < ymin) {
        ymin = c.y;
      }
    });

    return {
      x : xmin,
      y : ymin,
      w : xmax - xmin,
      h : ymax - ymin
    };
  },

  offset : function(delta) {

    var raw = [],
        ret = [],
        last = null,
        bisectors = [],
        rightVec = Vec2(1, 0);

    // Compute bisectors
    this.each(function(prev, current, next, idx) {
      var e1 = current.subtract(prev, true).normalize();
      var e2 = current.subtract(next, true).normalize();
      var ecross = e1.perpDot(e2);
      var length = delta / Math.sin(Math.acos(e1.dot(e2))/2);

      length = -length;
      var angleToZero = rightVec.angleTo(current.subtract(prev, true).normalize());

      var rads = prev.subtract(current, true).normalize().angleTo(
        next.subtract(current, true).normalize()
      )

      var bisector = Vec2(length, 0).rotate(angleToZero + rads/2);

      if (ecross < 0)
      {
        bisector.add(current);
      } else {
        bisector = current.subtract(bisector, true);
      }
      bisector.cornerAngle = rads;
      current.bisector = bisector;
      bisector.point = current;
      raw.push(bisector);
    });
    
    Polygon(raw).each(function(p, c, n, i) {

      var isect = segseg(c, c.point, n, n.point);

      if (isect && isect !== true) {
        // This means that the offset is self-intersecting
        // find where and use that as the current vec instead

        var isect2 = segseg(
          p,
          c,
          n,
          this.point(i+2)
        );

        if (isect2 && isect2 !== false) {
          isect = isect2;
        }

        this.remove(c);
        c.set(isect[0], isect[1]);

      }

      ret.push(c)
    });

    return Polygon(ret);

  },

  line : function(idx) {
    return [this.point(idx), this.point(idx+1)];
  },

  lines : function(fn) {
    var idx = 0;
    this.each(function(p, start, end) {
      fn(start, end, idx++);
    });

    return this;
  },

  selfIntersections : function() {
    var ret = [];

    // TODO: use a faster algorithm. Bentley–Ottmann is a good first choice
    this.lines(function(s, e, i) {
      this.lines(function(s2, e2, i2) {

        if (!s2.equal(e) && !s2.equal(s) && !e2.equal(s) && !e2.equal(e) && i+1 < i2) {
          var isect = segseg(s, e, s2, e2);
          // self-intersection
          if (isect && isect !== true) {
            var vec = Vec2.fromArray(isect);
            // TODO: wow, this is inneficient but is crucial for creating the
            //       tree later on.
            vec.s = i + (s.subtract(vec, true).length() / s.subtract(e, true).length())
            vec.b = i2 + (s2.subtract(vec, true).length() / s2.subtract(e2, true).length())

            ret.push(vec);
          }
        }
      });
    }.bind(this));
    return Polygon(ret);
  },

  pruneSelfIntersections : function() {
    var selfIntersections = this.selfIntersections();

    var belongTo = function(s1, b1, s2, b2) {
      return s1 > s2 && b1 < b2
    }

    var contain = function(s1, b1, s2, b2) {
      return s1 < s2 && b1 > b2;
    }

    var interfere = function(s1, b1, s2, b2) {
      return (s1 < s2 && s2 < b1 && b2 > b1) || (s2 < b1 && b1 < b2 && s1 < s2); 
    }

    function Node(value) {
      this.value = value;
      this.children = [];
    }

    // TODO: create tree based on relationship operations

    var rootVec = this.point(0).clone();
    rootVec.s = 0;
    rootVec.b = (this.points.length-1) + 0.99;
    var root = new Node(rootVec);
    var last = root;
    var tree = [rootVec];
    selfIntersections.each(function(p, c, n) {
      console.log(
        'belongTo:', belongTo(last.s, last.b, c.s, c.b),
        'contain:', contain(last.s, last.b, c.s, c.b),
        'interfere:', interfere(last.s, last.b, c.s, c.b)
      );

      //if (!contain(1-last.s, 1-last.b, 1-c.s, 1-c.b)) {
        tree.push(c);
        last = c;
      //} else {
        // collect under children
      //}

    });

    var ret = [];

    if (tree.length < 2) {
      return ret;
    }

    tree.sort(function(a, b) {
      return a.s - b.s;
    });

    for (var i=0; i<tree.length; i+=2) {
      var poly = [];
      var next = (i<tree.length-1) ? tree[i+1] : null;

     if (next) {

        // collect up to the next isect
        for (var j = Math.floor(tree[i].s); j<=Math.floor(next.s); j++) {
          poly.push(this.point(j));
        }

        poly.push(next);
        poly.push(this.point(Math.floor(tree[i].b)));
      } else {
        poly.push(tree[i])
        for (var k = Math.floor(tree[i].s+1); k<=Math.floor(tree[i].b); k++) {
          poly.push(this.point(k));
        }
      }

      ret.push(new Polygon(poly));
    }
    return ret;
  },

  get length() {
    return this.points.length
  },

  clone : function() {
    var points = [];
    this.each(function(p, c) {
      points.push(c.clone());
    });
    return new Polygon(points);
  },

  rotate: function(rads, origin, returnNew) {
    origin = origin || this.center();

    var obj = (returnNew) ? this.clone() : this;

    return obj.each(function(p, c) {
      c.subtract(origin).rotate(rads).add(origin);
    });
  },

  translate : function(vec2, returnNew) {
    var obj = (returnNew) ? this.clone() : this;

    obj.each(function(p, c) {
      c.add(vec2);
    });

    return obj;
  },

  equal : function(poly) {
    var current = poly.length;

    while(current--) {
      if (!this.point(current).equal(poly.point(current))) {
        return false;
      }
    }
    return true;
  }
};

if (typeof module !== 'undefined') {
  module.exports = Polygon;
}
},{"segseg":3,"vec2":4}],3:[function(require,module,exports){
/*  Ported from Mukesh Prasad's public domain code:
 *    http://tog.acm.org/resources/GraphicsGems/gemsii/xlines.c
 *
 *   This function computes whether two line segments,
 *   respectively joining the input points (x1,y1) -- (x2,y2)
 *   and the input points (x3,y3) -- (x4,y4) intersect.
 *   If the lines intersect, the return value is an array
 *   containing coordinates of the point of intersection.
 *
 *   Params
 *        x1, y1,  x2, y2   Coordinates of endpoints of one segment.
 *        x3, y3,  x4, y4   Coordinates of endpoints of other segment.
 *
 *   Also Accepts:
 *    4 objects with the minimal object structure { x: .., y: ..}
 *    4 arrays where [0] is x and [1] is y
 *
 *   The value returned by the function is one of:
 *
 *        undefined - no intersection
 *        array     - intersection
 *        true      - colinear
 */

module.exports = function(x1, y1, x2, y2, x3, y3, x4, y4) {

  if (arguments.length === 4) {
    var p1 = x1;
    var p2 = y1;
    var p3 = x2;
    var p4 = y2;

    // assume array [x, y]
    if (p1.length && p1.length === 2) {
      x1 = p1[0];
      y1 = p1[1];
      x2 = p2[0];
      y2 = p2[1];
      x3 = p3[0];
      y3 = p3[1];
      x4 = p4[0];
      y4 = p4[1];

    // assume object with obj.x and obj.y
    } else {
      x1 = p1.x;
      y1 = p1.y;
      x2 = p2.x;
      y2 = p2.y;
      x3 = p3.x;
      y3 = p3.y;
      x4 = p4.x;
      y4 = p4.y;
    }
  }


  var a1, a2, b1, b2, c1, c2; // Coefficients of line eqns.
  var r1, r2, r3, r4;         // 'Sign' values
  var denom, offset;          // Intermediate values
  var x, y;                   // Intermediate return values

  // Compute a1, b1, c1, where line joining points 1 and 2
  // is "a1 x  +  b1 y  +  c1  =  0".
  a1 = y2 - y1;
  b1 = x1 - x2;
  c1 = x2 * y1 - x1 * y2;

  // Compute r3 and r4.
  r3 = a1 * x3 + b1 * y3 + c1;
  r4 = a1 * x4 + b1 * y4 + c1;

  // Check signs of r3 and r4.  If both point 3 and point 4 lie on
  // same side of line 1, the line segments do not intersect.
  if ( r3 !== 0 && r4 !== 0 && ((r3 >= 0 && r4 >= 0) || (r3 < 0 && r4 < 0))) {
    return; // no intersection
  }


  // Compute a2, b2, c2
  a2 = y4 - y3;
  b2 = x3 - x4;
  c2 = x4 * y3 - x3 * y4;

  // Compute r1 and r2
  r1 = a2 * x1 + b2 * y1 + c2;
  r2 = a2 * x2 + b2 * y2 + c2;

  // Check signs of r1 and r2.  If both point 1 and point 2 lie
  // on same side of second line segment, the line segments do
  // not intersect.
  if (r1 !== 0 && r2 !== 0 && ((r1 >= 0 && r2 >= 0) || (r1 < 0 && r2 < 0))) {
    return; // no intersections
  }

  // Line segments intersect: compute intersection point.
  denom = a1 * b2 - a2 * b1;

  if ( denom === 0 ) {
    return true;
  }

  offset = denom < 0 ? - denom / 2 : denom / 2;

  x = b1 * c2 - b2 * c1;
  y = a2 * c1 - a1 * c2;

  return [
    ( x < 0 ? x : x ) / denom,
    ( y < 0 ? y : y ) / denom,
  ];
};

},{}],4:[function(require,module,exports){
;(function inject(clean, precision, undef) {

  function Vec2(x, y) {
    if (!(this instanceof Vec2)) {
      return new Vec2(x, y);
    }

    if('object' === typeof x && x) {
      this.y = x.y || 0;
      this.x = x.x || 0;
      return
    }

    this.x = Vec2.clean(x || 0);
    this.y = Vec2.clean(y || 0);
  };

  Vec2.prototype = {
    change : function(fn) {
      if (fn) {
        if (this.observers) {
          this.observers.push(fn);
        } else {
          this.observers = [fn];
        }
      } else if (this.observers) {
        for (var i=this.observers.length-1; i>=0; i--) {
          this.observers[i](this);
        }
      }

      return this;
    },

    ignore : function(fn) {
      this.observers = this.observers.filter(function(cb) {
        return cb !== fn;
      });

      return this;
    },

    dirty : function() {
      this._dirty = true
      this.__cachedLength = null
      this.__cachedLengthSquared = null
    },

    // set x and y
    set: function(x, y, silent) {
      if('number' != typeof x) {
        silent = y;
        y = x.y;
        x = x.x;
      }
      if(this.x === x && this.y === y)
        return this;

      this.x = Vec2.clean(x);
      this.y = Vec2.clean(y);

      this.dirty()
      if(silent !== false)
        return this.change();
    },

    // reset x and y to zero
    zero : function() {
      return this.set(0, 0);
    },

    // return a new vector with the same component values
    // as this one
    clone : function() {
      return new Vec2(this.x, this.y);
    },

    // negate the values of this vector
    negate : function(returnNew) {
      if (returnNew) {
        return new Vec2(-this.x, -this.y);
      } else {
        return this.set(-this.x, -this.y);
      }
    },

    // Add the incoming `vec2` vector to this vector
    add : function(vec2, returnNew) {
      if (!returnNew) {
        this.x += vec2.x; this.y += vec2.y;
        return this.change()
      } else {
        // Return a new vector if `returnNew` is truthy
        return new Vec2(
          this.x + vec2.x,
          this.y + vec2.y
        );
      }
    },

    // Subtract the incoming `vec2` from this vector
    subtract : function(vec2, returnNew) {
      if (!returnNew) {
        this.x -= vec2.x; this.y -= vec2.y;
        return this.change()
      } else {
        // Return a new vector if `returnNew` is truthy
        return new Vec2(
          this.x - vec2.x,
          this.y - vec2.y
        );
      }
    },

    // Multiply this vector by the incoming `vec2`
    multiply : function(vec2, returnNew) {
      var x,y;
      if ('number' !== typeof vec2) { //.x !== undef) {
        x = vec2.x;
        y = vec2.y;

      // Handle incoming scalars
      } else {
        x = y = vec2;
      }

      if (!returnNew) {
        return this.set(this.x * x, this.y * y);
      } else {
        return new Vec2(
          this.x * x,
          this.y * y
        );
      }
    },

    // Rotate this vector. Accepts a `Rotation` or angle in radians.
    //
    // Passing a truthy `inverse` will cause the rotation to
    // be reversed.
    //
    // If `returnNew` is truthy, a new
    // `Vec2` will be created with the values resulting from
    // the rotation. Otherwise the rotation will be applied
    // to this vector directly, and this vector will be returned.
    rotate : function(r, inverse, returnNew) {
      var
      x = this.x,
      y = this.y,
      cos = Math.cos(r),
      sin = Math.sin(r),
      rx, ry;

      inverse = (inverse) ? -1 : 1;

      rx = cos * x - (inverse * sin) * y;
      ry = (inverse * sin) * x + cos * y;

      if (returnNew) {
        return new Vec2(rx, ry);
      } else {
        return this.set(rx, ry);
      }
    },

    // Calculate the length of this vector
    length : function() {
      var x = this.x, y = this.y;
      return Math.sqrt(x * x + y * y);
    },

    // Get the length squared. For performance, use this instead of `Vec2#length` (if possible).
    lengthSquared : function() {
      var x = this.x, y = this.y;
      return x*x+y*y;
    },

    // Return the distance betwen this `Vec2` and the incoming vec2 vector
    // and return a scalar
    distance : function(vec2) {
      var x = this.x - vec2.x;
      var y = this.y - vec2.y;
      return Math.sqrt(x*x + y*y)
    },

    // Convert this vector into a unit vector.
    // Returns the length.
    normalize : function(returnNew) {
      var length = this.length();

      // Collect a ratio to shrink the x and y coords
      var invertedLength = (length < Number.MIN_VALUE) ? 0 : 1/length;

      if (!returnNew) {
        // Convert the coords to be greater than zero
        // but smaller than or equal to 1.0
        return this.set(this.x * invertedLength, this.y * invertedLength);
      } else {
        return new Vec2(this.x * invertedLength, this.y * invertedLength)
      }
    },

    // Determine if another `Vec2`'s components match this one's
    // also accepts 2 scalars
    equal : function(v, w) {
      if (w === undef) {
        w = v.y;
        v = v.x;
      }

      return (Vec2.clean(v) === this.x && Vec2.clean(w) === this.y)
    },

    // Return a new `Vec2` that contains the absolute value of
    // each of this vector's parts
    abs : function(returnNew) {
      var x = Math.abs(this.x), y = Math.abs(this.y);

      if (returnNew) {
        return new Vec2(x, y);
      } else {
        return this.set(x, y);
      }
    },

    // Return a new `Vec2` consisting of the smallest values
    // from this vector and the incoming
    //
    // When returnNew is truthy, a new `Vec2` will be returned
    // otherwise the minimum values in either this or `v` will
    // be applied to this vector.
    min : function(v, returnNew) {
      var
      tx = this.x,
      ty = this.y,
      vx = v.x,
      vy = v.y,
      x = tx < vx ? tx : vx,
      y = ty < vy ? ty : vy;

      if (returnNew) {
        return new Vec2(x, y);
      } else {
        return this.set(x, y);
      }
    },

    // Return a new `Vec2` consisting of the largest values
    // from this vector and the incoming
    //
    // When returnNew is truthy, a new `Vec2` will be returned
    // otherwise the minimum values in either this or `v` will
    // be applied to this vector.
    max : function(v, returnNew) {
      var
      tx = this.x,
      ty = this.y,
      vx = v.x,
      vy = v.y,
      x = tx > vx ? tx : vx,
      y = ty > vy ? ty : vy;

      if (returnNew) {
        return new Vec2(x, y);
      } else {
        return this.set(x, y);
      }
    },

    // Clamp values into a range.
    // If this vector's values are lower than the `low`'s
    // values, then raise them.  If they are higher than
    // `high`'s then lower them.
    //
    // Passing returnNew as true will cause a new Vec2 to be
    // returned.  Otherwise, this vector's values will be clamped
    clamp : function(low, high, returnNew) {
      var ret = this.min(high, true).max(low)
      if (returnNew) {
        return ret;
      } else {
        return this.set(ret.x, ret.y);
      }
    },

    // Perform linear interpolation between two vectors
    // amount is a decimal between 0 and 1
    lerp : function(vec, amount) {
      return this.add(vec.subtract(this, true).multiply(amount), true);
    },

    // Get the skew vector such that dot(skew_vec, other) == cross(vec, other)
    skew : function() {
      // Returns a new vector.
      return new Vec2(-this.y, this.x)
    },

    // calculate the dot product between
    // this vector and the incoming
    dot : function(b) {
      return Vec2.clean(this.x * b.x + b.y * this.y);
    },

    // calculate the perpendicular dot product between
    // this vector and the incoming
    perpDot : function(b) {
      return Vec2.clean(this.x * b.y - this.y * b.x)
    },

    // Determine the angle between two vec2s
    angleTo : function(vec) {
      return Math.atan2(this.perpDot(vec), this.dot(vec));
    },

    // Divide this vector's components by a scalar
    divide : function(scalar, returnNew) {
      if (scalar === 0 || isNaN(scalar)) {
        throw new Error('division by zero')
      }

      if (returnNew) {
        return new Vec2(this.x/scalar, this.y/scalar);
      }

      return this.set(this.x / scalar, this.y / scalar);
    },

    isPointOnLine : function(start, end) {
      return (start.y - this.y) * (start.x - end.x) ===
             (start.y - end.y) * (start.x - this.x);
    },

    toArray: function() {
      return [this.x, this.y];
    },

    fromArray: function(array) {
      return this.set(array[0], array[1]);
    },
    toJSON: function () {
      return {x: this.x, y: this.y}
    },
    toString: function() {
      return '(' + this.x + ', ' + this.y + ')';
    }
  };

  Vec2.fromArray = function(array) {
    return new Vec2(array[0], array[1]);
  };

  // Floating point stability
  Vec2.precision = precision || 8;
  var p = Math.pow(10, Vec2.precision)

  Vec2.clean = clean || function(val) {
    if (isNaN(val)) {
      throw new Error('NaN detected')
    }

    if (!isFinite(val)) {
      throw new Error('Infinity detected');
    }

    if(Math.round(val) === val) {
      return val;
    }

    return Math.round(val * p)/p;
  };

  Vec2.inject = inject;

  if(!clean) {
    Vec2.fast = inject(function (k) { return k })

    // Expose, but also allow creating a fresh Vec2 subclass.
    if (typeof module !== 'undefined' && typeof module.exports == 'object') {
      module.exports = Vec2;
    } else {
      window.Vec2 = window.Vec2 || Vec2;
    }
  }
  return Vec2
})();



},{}]},{},[1])
;