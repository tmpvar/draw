function LineMode(modeManager, draw) {
  DrawMode.call(this, modeManager);

  this.draw = draw;
  this.line = null;
}

LineMode.prototype = Object.create(DrawMode.prototype);

LineMode.prototype.keydown = function(event) {

  switch (event.keyCode) {

    case 27: // escape
      this.line = null;
      this.draw.renderables.pop();
      this.modeManager.mode('navigation');
      return true;
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
    // begin the line
    this.line = new Line(
      new Point(event.position),
      new Point(event.position)
    );

    this.draw.renderables.push(this.line);

    return true;
  }
};