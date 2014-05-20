
Polygon.prototype.isPolygon = true;
Polygon.prototype.render = function(ctx, delta) {

  // TODO: consider making Segment2 a dependency of polygon

  var line = new Line();

  ctx.beginPath();
    var first = this.point(0);
    ctx.moveTo(first.x, first.y);
    this.each(function(p, point, n, i) {
      ctx.lineTo(n.x, n.y);
    });

  ctx.lineWidth = 1;
  ctx.closePath();
  ctx.strokeStyle = "rgba(255,255,255,.6)";
  ctx.stroke();
  if (this.hovered) {
    ctx.fillStyle = "rgba(0, 255, 0, .05)";
    ctx.fill();
  } else if (ctx.fillBackground) {
    console.log('here');
    ctx.save();
      ctx.rotate(-Math.PI/10);
      ctx.fillStyle = ctx.fillBackground;
      ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
    this.each(function(p, point, n, i) {
      line.start = point;
      line.end = n;
      line.hovered = this.hoveredLines && this.hoveredLines[i];
      if (line.hovered) {
        line.render(ctx, delta);
      } else {
        line.start.render(ctx, delta);
        line.end.render(ctx, delta);
      }
    });
  ctx.closePath();


};

Polygon.prototype.computeGeometry = function(array, hole) {

  this.rewind(hole);

  for (var i = 0; i<this.points.length; i++) {
    var iy = new Point(this.points[i].x, this.points[i].y);
    iy.y = -iy.y
    array.push(iy);
  }

  return array;
};

Polygon.prototype.hit = function(vec, threshold) {
  var contains =  false;
  var p = this.points, l = p.length;

  this.hoveredLines = {};
  var ret = [];
  for (var i=0; i<l; i++) {
    var line = new Line(p[i], this.point(i+1))
    var hoveredLine = line.hit(vec, threshold).filter(Boolean);

    if (hoveredLine.length) {
      this.hoveredLines[i] = true;
      Array.prototype.push.apply(ret, hoveredLine);
    }
  }

  contains = contains || this.containsPoint(vec);
  this.hovered = contains || contains.length;

  return ret;
};
