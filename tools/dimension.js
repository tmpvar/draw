function Dimension() {
  if (!(this instanceof Dimension)) {
    return new Dimension();
  }

  this.references = [];

  this.relativePosition = new Vec2();

  // var change = function() {
  //   this._value = a.point.distance(b.point);
  // }.bind(this);

  // a.point.change(change);
  // b.point.change(change);

  this._value = 0;
}

Dimension.prototype.destroy = function() {
  console.warn('TODO: cleanup event handlers')
}

Dimension.prototype.getDimensionValue = function() {
  var points = this.extractPointsOfInterest();
  return Vec2.clean(points[0].distance(points[1]));
};

Dimension.prototype.addReference = function(ref) {
  this.references.push(ref);

  this.val(this.getDimensionValue());
  ref.thing.change(function() {
    this.val(this.getDimensionValue(), true);
  }.bind(this));

  return this;
};

Dimension.prototype.removeReference = function(ref) {
  this.references = this.references.filter(function(a) {
    return a !== ref;
  });

  return ref;
};

Dimension.prototype.extractPointsOfInterest = function() {
  if (this.references.length === 1) {
    var ref = this.references[0];

    // We must be tracking the length of the line
    if (ref.thing instanceof Line) {
      return [ref.thing.start, ref.thing.end];
    }
  } else {
    var extractPoint = function(ref) {
      // TODO: line->line is probably an angular dimension
      //       unless they are parallel
      if (ref.thing instanceof Line) {
        return ref.thing.start;
      } else if (ref.thing instanceof Point) {
        return ref.thing;
      }
    };

    return this.references.map(extractPoint);
  }
};

Dimension.prototype.construction = true;
Dimension.prototype.helper = true;

Dimension.prototype.val = function(val, silent) {

  if (typeof val !== 'undefined') {

    if (!silent && this.references.length) {
      var orig = this._value;
      var current = val;
      var diff = current - orig;

      // TODO: handle other types!
      var ref = this.references[0]
      if (ref.thing instanceof Line && diff !== 0 && current !== 0) {

        // TODO: this needs to hit a constraint solver or some such
        var seg = ref.thing
        var midpoint = seg.midpoint();
        var adiff = seg.start.subtract(midpoint, true).normalize();

        var angle = Vec2(1,0).angleTo(adiff);

        var vec = Vec2(current/2, 0).rotate(angle);
        seg.start.set(midpoint.add(vec, true), true);
        seg.end.set(midpoint.subtract(vec), true);
      }
    }

    this._value = val;
  }

  return this._value;
};

Dimension.prototype.hit = function() {

  return [];
};

Dimension.prototype.render = function(ctx, deltaTime) {

  var points = this.extractPointsOfInterest();
  var line = new Line2(points[0].x, points[0].y, points[1].x, points[1].y);
  var perp = line.createPerpendicular(points[0]);
  var closest = perp.closestPointTo(this.relativePosition);
  var other = closest.subtract(points[0], true).add(points[1]);

  var x = this.relativePosition.x;
  var y = this.relativePosition.y;


  ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(closest.x, closest.y);

    ctx.lineTo(other.x, other.y);
    ctx.lineTo(points[1].x, points[1].y );

    ctx.moveTo(other.x, other.y);
    ctx.lineTo(x, y);

    ctx.strokeStyle = "red";
    ctx.stroke();


  ctx.fillStyle = "#ccc";
  ctx.font = "22px monospace"
  ctx.fillText(Number(this.val()).toFixed(2), x, y);

};
