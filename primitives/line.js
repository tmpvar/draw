function Line(start, end) {

  this.start = start;
  this.end = end;
} 

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