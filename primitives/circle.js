function Circle(origin) {
  this.origin = new Point(origin);
  this.color = "white";
}

Circle.prototype.radius = 1;
Circle.prototype.helper = null;

Circle.prototype.hit = function(vec) {

};

Circle.prototype.render = function(ctx) {
  ctx.save();

    this.origin.render(ctx);
    this.helper && this.helper.render(ctx);

    ctx.translate(this.origin.x, this.origin.y)

    ctx.beginPath();
      ctx.arc(0, 0, this.radius, Math.PI*2, false);
    ctx.closePath();
    ctx.strokeStyle = this.color;
    ctx.stroke();
  ctx.restore();
};
