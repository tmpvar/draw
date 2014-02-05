
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
    var iy = this.points[i].clone();
    iy.y = -iy.y
    array.push(iy);
  }

  return array;
};

Polygon.prototype.hit = function(vec, threshold) {
  var contains =  false;
  var line = new Line();
  var p = this.points, l = p.length;

  this.hoveredLines = {};

  for (var i=0; i<l; i++) {
    contains = p[i].hit(vec, threshold);

    line.start = p[i];
    line.end = this.point(i+1);
    var hoveredLine = line.hit(vec, threshold);
    if (hoveredLine) {
      this.hoveredLines[i] = true;
    }
    contains = contains || hoveredLine;
  }

  contains = contains || this.closestPointTo(vec).distance(vec) < threshold;
  contains = contains || this.containsPoint(vec);
  this.hovered = contains;

  return contains;
};