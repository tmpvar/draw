function DimensionMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
}

DimensionMode.prototype = Object.create(Mode.prototype);

DimensionMode.prototype.activate = function(prev, options) {
  this.dimension = null;
};

DimensionMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 27: // escape
      this.exit();
      return true;
    break;
  }
};

DimensionMode.prototype.mousemove = function(event) {
  if (this.dimension) {
    this.dimension.relativePosition.set(event.position);
  }
}

DimensionMode.prototype.mousedown = function(event) {
  var hits = collectHits(
    this.draw.renderables,
    this.draw.fixMouse(event),
    this.draw.hitThreshold
  ).filter(function(hit) {
    return hit.thing && hit.thing.move && !hit.thing.helper;
  });

  if (hits.length) {

    // Create a new dimension object
    if (!this.dimension) {

      this.dimension = Dimension().addReference(hits[0]);
      this.dimension.relativePosition.set(event.position);
    // Update the dimension object by setting it's `b` reference
    } else {
      this.dimension.addReference(hits[0]);
    }

    return true;

  } else if (this.dimension) {
    this.draw.renderables.push(this.dimension);
    this.dimension = null;
  }
};

DimensionMode.prototype.update = function(ctx, deltaTime) {
  if (this.dimension) {
    this.dimension.render(ctx, deltaTime);
  }
};
