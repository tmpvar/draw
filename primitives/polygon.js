
Polygon.prototype.isPolygon = true;
Polygon.prototype.render = function(ctx, delta) {

  // TODO: consider making Segment2 a dependency of polygon

  var line = new Line();

  ctx.beginPath();
    this.each(function(p, point, n, i) {
      line.start = point;
      line.end = n;
      line.hovered = this.hoveredLines && this.hoveredLines[i];
      line.render(ctx, delta);
    });
  ctx.closePath();

  if (this.hovered) {
    console.log('filling')
    ctx.fillStyle = "rgba(0, 255, 0, .05)";
    ctx.fill();
  } else {
    console.log('skip')
  }
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
    contains = contains || hoveredLine;
  }

  contains = contains || this.closestPointTo(vec).distance(vec) < threshold;
  contains = contains || this.containsPoint(vec);
  this.hovered = contains;

  return ret;
};