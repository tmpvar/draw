
Circle.prototype.color = "white";

Circle.prototype.render = function(ctx) {
  ctx.save();

    if (this.position.render) {
      this.position.render(ctx);
    }

    if (this.helper) {
      this.helper.render(ctx);
    }

    ctx.translate(this.position.x, this.position.y);

    ctx.beginPath();
      ctx.arc(0, 0, this.radius(), Math.PI*2, false);
    ctx.closePath();
    ctx.strokeStyle = this.color;
    ctx.stroke();
  ctx.restore();
};

var TAU = Math.PI*2;
Circle.prototype.computeGeometry = function(array) {
  var segments = 4;

  for (var i = 0; i <= segments; i++) {

    var segment = i / segments * TAU;
    var radius = this.radius();
    array.push(Vec2(
      radius * Math.cos( segment ),
      radius * Math.sin( segment )
    ));
  }

  return array;
};
