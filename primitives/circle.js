
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

    if (this.hovered) {
      ctx.fillStyle = "rgba(0, 255, 0, .05)";
      ctx.fill();
    }

    ctx.strokeStyle = this.color;
    ctx.stroke();
  ctx.restore();
};

var TAU = Math.PI*2;
Circle.prototype.computeGeometry = function(array, hole) {
  var segments = 32;

  var radius = this.radius();

  var transform = new Vec2(this.position.x, -this.position.y);

  for (var i = 0; i <= segments; i++) {

    var segment = i / segments * TAU;
    array.push(Vec2(
      Math.cos(segment),
      Math.sin(segment)
    ).multiply(radius).add(transform));
  }

  if (!hole) {
    array.reverse();
  }

  return array;
};

Circle.prototype.hit = function(vec) {
  var d2 = this.position.distance(vec);
  var r = this.radius();

  // TODO: outer ring highlight

  if (d2 < r) {

    if (this.position.subtract(vec, true).lengthSquared() < 50) {
      this.position.hovered = true;
    } else {
      this.hovered = true;
      this.position.hovered = false;
    }

    return true;
  } else {
    if (this.position.hovered || this.hovered) {
      this.position.hovered = false;
      this.hovered = false;
      return true;
    }
  }
};
