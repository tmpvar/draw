
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

    if (this.circumferenceHovered) {
      ctx.strokeStyle = 'green';
    } else {
      ctx.strokeStyle = this.color;
    }
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

Circle.prototype.hit = function(vec, threshold) {
  var d2 = this.position.distance(vec);
  var r = this.radius();
  var halfThreshold = threshold / 2;

  if (d2 < r - halfThreshold) {

    if (d2 < threshold) {
      this.position.hovered = true;
      this.hovered = false;
      this.circumferenceHovered = false;
    } else {
      this.hovered = true;
      this.position.hovered = false;
      this.circumferenceHovered = false;
    }

    return true;
  } else if (Math.abs(d2 - r) < halfThreshold) {
    this.position.hovered = false;
    this.hovered = false;
    this.circumferenceHovered = true;
    return true;

  } else {
    if (this.position.hovered || this.hovered || this.circumferenceHovered) {
      this.position.hovered = false;
      this.hovered = false;
      this.circumferenceHovered = false;
      return true;
    }
  }
};
