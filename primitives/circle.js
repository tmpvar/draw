function Circle(origin) {
  this.origin = origin;
  this.color = "red";
}

Circle.prototype.radius = 1;

Circle.prototype.hit = function(vec) {

};

Circle.prototype.render = function(ctx) {
  ctx.save();
    ctx.translate(this.origin.x, this.origin.y)
    ctx.beginPath();
      ctx.arc(0, 0, this.radius, Math.PI*2, false);
    ctx.closePath();
    ctx.strokeStyle = this.color;
    ctx.stroke();
  ctx.restore();
};
