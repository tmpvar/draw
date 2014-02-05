function Line(start, end) {
  Segment2.call(this, start, end);
}

Line.prototype = Object.create(Segment2.prototype);

Line.prototype.isLine = true;
Line.prototype.finalized = false;
Line.prototype.hovered = false;

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
  if (this.hovered) {
    ctx.strokeStyle = "green";
  } else {
    ctx.strokeStyle = "#fff";
  }
  ctx.stroke();

  this.start.render(ctx);
  this.end.render(ctx);
};

Line.prototype.hit = function(vec, threshold) {
  var ret = [];
  var hit = this.closestPointTo(vec);
  var distanceToHit = hit.distance(vec);
  var lineHit = distanceToHit < threshold/4;

  if (lineHit) {
    ret.push(new Hit(this, distanceToHit));
  }

  ret.push(this.start.hit(vec, threshold));
  ret.push(this.end.hit(vec, threshold));

  this.hovered = lineHit;

  return ret;
};

Line.prototype.move = function(vec) {
  this.start.add(vec);
  this.end.add(vec);
};
