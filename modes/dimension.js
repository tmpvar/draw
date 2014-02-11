function DimensionMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);

  this.dialogOk = new Action('ok', 13);
  this.dialogCancel = new Action('cancel', 27);
  this.dimensionValue = Field('value', Field.FLOAT, '1.0')
  this.dialog = Dialog('dimension', [
    this.dimensionValue
  ], [
    this.dialogCancel,
    this.dialogOk
  ]);

  this.dialogOk.perform = function() {
    this.dialog.deactivate();
    return true;
  }.bind(this);

  this.dialogCancel.perform = function() {
    this.dialog.deactivate();


    // TODO: allow `editmode` to be passed in activate which will:
    //       return a user directly to the previous mode if esc/enter
    //       are pressed

    if (!this.dimension) {
      this.exit();
    } else if (!this.dimension.finalized) {
      this.draw.remove(this.dimension);
      this.dimension.destroy();
    }

    this.dimension = null;

    return true;
  }.bind(this);

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
};

DimensionMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 27: // escape
      this.exit();
      return true;
    break;
  }

  return this.dialog.handleEvent(event);
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

DimensionMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    var r;
    if (this.dialog) {
      r = this.dialog.handleEvent(event);
    }

    if (!r) {
      r = this[type](event);
    }
    return r;
  }
};
