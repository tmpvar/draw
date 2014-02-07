function DimensionMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
}

DimensionMode.prototype = Object.create(Mode.prototype);

DimensionMode.prototype.activate = function(prev, options) {
  this.start = null;
};

DimensionMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 27: // escape
      this.exit();
      return true;
    break;
  }
};

DimensionMode.prototype.mousedown = function(event) {
  var hits = collectHits(
    this.draw.renderables,
    this.draw.fixMouse(event),
    this.draw.hitThreshold
  ).filter(function(hit) {
    return hit.thing && hit.thing.move && !hit.thing.helper;
  });

  if (hits.length) {
    if (!this.start) {
      this.start = hits[0];
    } else {
      this.draw.renderables.push(
        new Dimension(this.start, hits[0])
      );
      this.start = null;
    }

    return true;
  }
};
