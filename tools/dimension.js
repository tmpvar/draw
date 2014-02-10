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

Dimension.prototype.addReference = function(ref) {
  this.references.push(ref);
  return this;
};

Dimension.prototype.removeReference = function(ref) {
  this.references = this.references.filter(function(a) {
    return a !== ref;
  });

  return ref;
};

Dimension.prototype.extractPointsOfInterest = function() {
  console.log(this.references);
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
  ctx.fillText(Number(points[0].distance(points[1])).toFixed(2), x, y);

};