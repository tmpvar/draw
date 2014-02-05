function Dimension(a, b, value) {
  this.a = a;
  this.b = b;

  var change = function() {
    this._value = a.distance(b);
  }.bind(this);

  a.change(change);
  b.change(change);

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
      ctx.moveTo(this.a.x, this.a.y);
      ctx.lineTo(this.b.x, this.b.y);
    ctx.closePath();
    ctx.strokeStyle = "#f0f";
    ctx.stroke();

    var mid = this.a.subtract(this.b, true).divide(2).add(this.b);
    ctx.fillStyle = "white";
    ctx.fillText(this._value, mid.x, mid.y);

  ctx.restore();
};