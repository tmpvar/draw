
Polygon.prototype.isPolygon = true;

Polygon.prototype.render = function(ctx, delta) {

  ctx.beginPath();
    this.each(function(p, point) {
      ctx.lineTo(point.x, point.y);
    });
  ctx.closePath();
  ctx.strokeStyle = "white";
  ctx.stroke();

  this.each(function(c, point) {
    point.render(ctx, delta);
  });
};



Polygon.prototype.computeGeometry = function(array) {
  Array.prototype.push.apply(array, this.points);
  return array;
};
