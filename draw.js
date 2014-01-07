
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
