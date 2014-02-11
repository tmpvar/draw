function DimensionMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);

  this.dimensionValue = Field('value', Field.FLOAT, '1.0')
  this.dialog = Dialog('dimension', [
    this.dimensionValue
  ]);

  this.dimensionValue.change(this.valueChangeHandler.bind(this));
  this.changeHandlers = [];
}

DimensionMode.prototype = Object.create(Mode.prototype);

DimensionMode.prototype.valueChangeHandler = function() {
  this.dimension.val(this.dimensionValue.value());
  this.draw.dirty();
};

DimensionMode.prototype.activate = function(prev, options) {
  this.dimension = null;
  // TODO: options may provide a dimension
};

DimensionMode.prototype.deactivate = function() {
  this.dialog.deactivate();

  while(this.changeHandlers.length) {
    var h = this.changeHandlers.pop();
    h.thing.ignore(h.fn);
  }

}

DimensionMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 27: // escape
      this.exit();
      return true;
    break;
  }
};

DimensionMode.prototype.mousemove = function(event) {
  if (this.dimension && !this.dimension.finalized) {
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
    if (!this.dimension || this.dimension.finalized) {

      this.dimension = Dimension().addReference(hits[0]);
      this.dimension.relativePosition.set(event.position);

      // TODO: try not to reference the dom from in here.
      this.dialog.activate(document.querySelector('#dialog'));
      this.dimensionValue.value(this.dimension.val())
    // Update the dimension object by setting it's `b` reference
    } else {
      this.dimension.addReference(hits[0]);
    }

    return true;

  } else if (this.dimension) {
    this.draw.renderables.push(this.dimension);
    this.dimension.finalized = true;
  }
};

DimensionMode.prototype.update = function(ctx, deltaTime) {
  if (this.dimension) {
    this.dimension.render(ctx, deltaTime);
  }
};
