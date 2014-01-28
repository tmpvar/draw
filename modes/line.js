function LineMode(modeManager, draw) {
  this.modeManager = modeManager;
  this.draw = draw;
  this.line = null;
}

LineMode.prototype.mousemove = function(event) {
  if (this.line && event && event.position) {
    this.line.end.set(position);
    return true;
  }
};

LineMode.prototype.mousedown = function(event) {
  if (event && event.position) {
    var position = this.draw.fixMouse(event.position);
    // begin the line
    this.line = new Line(
      new Point(position),
      new Point(position)
    );

    this.draw.renderables.push(this.line);

    return true;
  }
};

LineMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};