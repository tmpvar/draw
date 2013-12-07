var v = require('vec2');
var segseg = require('segseg');
var closest = require('segseg.closest');
var Polygon = require('polygon');

var canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');
document.body.appendChild(canvas);


var drawPoints = function(points, color) {
  color = color || "red";
  ctx.beginPath()
ctx.lineWidth = .3 * lineWidth;
  (points.points || points).forEach(function(point) {

    //ctx.strokeStyle = 'rgba(255,255,255,.2)';
    //ctx.strokeRect(point.x-1, point.y-1, 2, 2);
    ctx.strokeStyle = color;
    ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();

  ctx.stroke();
};

var circle = function(vec, radius, color) {
  ctx.save(); 
    drawPoints([vec], "white");
    ctx.beginPath();
    ctx.arc(vec.x, vec.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = ctx.strokeStyle = color || 'green';
    ctx.closePath();
    ctx.stroke();
  ctx.restore();
};

var poly = [
  v(10, 40),
  v(20, 70),
  v(30, 90),
  v(20, 100),
  v(30, 120),
  v(50, 120),
  v(60, 150),
  v(90, 150),
  v(100, 120),
  v(140, 100),
  v(140, 70),
];

var r = 18;//22;
var where = 0;
var pos;
var lineWidth = 1;
var done = false;
window.requestAnimationFrame(function tick() {


  if (done) {
    return;
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 800, 600);
  ctx.save();

  ctx.scale(5,5);
  ctx.translate(5, -35)
  drawPoints(poly);
  var polygon = Polygon(poly);
  var O = polygon.clone().clean().rewind(true).offset(-r);

  drawPoints(O, '#00f');

  ctx.lineWidth = .1 * lineWidth;
  ctx.strokeStyle = "#F00";
  var out = [];

  O.each(function(p, c, n) {
    ctx.beginPath();
    ctx.moveTo(c.point.x, c.point.y);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();
    ctx.closePath();
  });

  O.each(function(p, c, n, i) {
    var n2 = (i<O.length-2) ? O.point(i+2) : O.point((i+2) % O.length);

    var i2 = segseg(p, c, n, n2);
    if (i2 && i2 !== true) {
      var i2v = v.fromArray(i2);
      i++;

      var c1 = closest(p.point, c.point, i2v, i2v);
      var d1 = i2v.distance(c1[0]);
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(i2v.x, i2v.y);
      ctx.lineTo(c1[0].x, c1[0].y);
      ctx.closePath();
      ctx.stroke();

      var c2 = closest(n.point, n2.point, i2v, i2v);
      var d2 = i2v.distance(c2[0]);
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(i2v.x, i2v.y);
      ctx.lineTo(c2[0].x, c2[0].y);
      ctx.closePath();
      ctx.stroke();

      var c3 = closest(c.point, n.point, i2v, i2v);
      var d3 = i2v.distance(c3[0]);
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(i2v.x, i2v.y);
      ctx.lineTo(c3[0].x, c3[0].y);
      ctx.closePath();
      ctx.stroke();

      var skipIsect = 0;

      if (skipIsect < 2) {
        out.push(i2v);
        circle(i2v, r, '#333');
      }
      circle(v(i2[0], i2[1]), r, '#333');
    } else if (!i2 && polygon.closestPointTo(c).distance(c) >= (r - .0001)) {
      out.push(c);
    }
  });

  drawPoints(out, '#0F0');

  var next = where > 0 ? where + 1 : 0;

  if (!pos) {
    pos = out[where];
  }

  var distance = out[where].distance(pos)
  if (distance < .5) {
    where++;

    if (where >= out.length) {
      where = 0;
      r++;
      pos = out[out.length-1];
    } else {
      pos = out[where > 0 ? where-1 : out.length-1].clone();
    }

    next = where > 0 ? where + 1 : 0;
  }

  pos.add(out[where].subtract(pos, true).normalize());

  circle(pos, r, '#00f');
  circle(pos, .5, '#fff');

  ctx.restore();

  window.requestAnimationFrame(tick);
});