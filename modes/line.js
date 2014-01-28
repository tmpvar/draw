function LineMode(modeManager, draw) {
  this.modeManager = modeManager;
  this.draw = draw;
  this.line = null;
}

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

}


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

LineMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};