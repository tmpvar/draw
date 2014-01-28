function LineMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
  this.line = null;
}

LineMode.prototype = Object.create(Mode.prototype);

LineMode.prototype.deactivate = function() {
  if (this.line && !this.line.finalized) {
    this.draw.renderables.pop();
    this.draw.dirty();
  }
}

LineMode.prototype.keydown = function(event) {

  switch (event.keyCode) {

    case 27: // escape
      this.line = null;
      this.draw.renderables.pop();
      this.modeManager.exit();
      return true;
    break;

    case 69:
      this.modeManager.exit();
    break;

    default:
      console.log('unhandled key', event.keyCode);
    break;
  }
};

LineMode.prototype.mousemove = function(event) {
  if (this.line && event && event.position) {
    this.line.end.set(event.position);
    return true;
  }
};

LineMode.prototype.mousedown = function(event) {
  if (event && event.position) {
    if (this.line) {
      this.line.finalized = true;
    }
    // begin the line
    this.line = new Line(
      new Point(event.position),
      new Point(event.position)
    );

    this.draw.renderables.push(this.line);

    return true;
  }
};