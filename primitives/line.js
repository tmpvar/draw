function Line(start, end) {

  this.start = start;
  this.end = end;
}

Line.prototype.isLine = true;
Line.prototype.finalized = false;

Line.prototype.computeGeometry = function(array) {
  if (this.finalized) {
    array.push(this.start);
    array.push(this.end);
  }
  return array;
};

Line.prototype.render = function(ctx) {
  ctx.beginPath()
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
  ctx.closePath();
  ctx.strokeStyle = "#fff";
  ctx.stroke();

  this.start.render(ctx);
  this.end.render(ctx);
};