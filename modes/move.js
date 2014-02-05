function MoveMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
}

MoveMode.prototype = Object.create(Mode.prototype);

MoveMode.prototype.target = null;

MoveMode.prototype.activate = function(old, options) {
  this.target = options.hit.thing;
  this.mouse = options.mouse.clone();
  this.diff = new Vec2(0, 0);
};

MoveMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 27: // escape

      // TODO: move the mouse back to where we started

      // second escape will take us back to navigation mode
      this.exit();

      return true;
    break;
  }
}

MoveMode.prototype.mousemove = function(event) {

  var newMouse = event.position;
  var diff = newMouse.subtract(this.mouse.add(this.diff, true), true);

  this.diff.add(diff)

  this.target.move(diff, newMouse);
};


MoveMode.prototype.mousedown = function(event) {

};

MoveMode.prototype.update = function(ctx, deltaTime) {
};
