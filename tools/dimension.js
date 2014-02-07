function Dimension(a, b, value) {
  this.a = a;
  this.b = b;

  var change = function() {
    this._value = a.point.distance(b.point);
  }.bind(this);

  a.point.change(change);
  b.point.change(change);

  this._value = value;
}

Dimension.prototype.construction = true;
Dimension.prototype.helper = true;

Dimension.prototype.val = function(val) {

  if (typeof val !== 'undefined') {
    this._value = val;
  }

  return this._value;
};

Dimension.prototype.hit = function() {

  return [];
};

Dimension.prototype.render = function(ctx, deltaTime) {
  ctx.save();

    ctx.beginPath();
      ctx.moveTo(this.a.point.x, this.a.point.y);
      ctx.lineTo(this.b.point.x, this.b.point.y);
    ctx.closePath();
    ctx.strokeStyle = "#f0f";
    ctx.stroke();

    var mid = this.a.point.subtract(this.b.point, true).divide(2).add(this.b.point);
    ctx.fillStyle = "white";
    ctx.font = "22px san-serif"
    ctx.fillText(this._value, mid.x, mid.y);

  ctx.restore();
};