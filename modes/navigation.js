function NavigationMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
}

NavigationMode.prototype = Object.create(Mode.prototype);

NavigationMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 76: // (l)ine
      this.modeManager.mode('line');
      return true;
    break;

    case 67: // (c)ircle
      this.modeManager.mode('circle');
      return true;
    break;

    case 68: // (d)imension
      this.modeManager.mode('dimension');
      return true;
    break;
  }
};

NavigationMode.prototype.mouseIsDown = false;

NavigationMode.prototype.mouseup = function(event) {
  if (this.mouseIsDown && this.moveTarget) {
    this.exit();
  }
  this.mouseIsDown = false;
  this.moveTarget = false;
};

NavigationMode.prototype.mousedown = function(event) {
  var hits = collectHits(
    this.draw.renderables,
    this.fixMouse(event),
    this.draw.hitThreshold
  ).filter(function(hit) {
      return hit.thing && hit.thing.move;
  });

  if (hits.length) {
    this.moveTarget = {
      mouse : this.draw.fixMouse(event),
      hit : hits[0]
    };

    this.mouseIsDown = true;
    return true;
  }
}

NavigationMode.prototype.fixMouse = function(event) {
  return new Point(event)
          .divide(this.draw.scale, true)
          .add(this.draw.translation)
          .subtract(
            Vec2(this.draw.canvas.width/2, this.draw.canvas.height/2)
          );
}

NavigationMode.prototype.mousemove = function(event) {
  if (this.moveTarget && this.modeManager.mode() !== 'move') {
    this.modeManager.mode('move', this.moveTarget);
  }

  // Visual aid
  collectHits(
    this.draw.renderables,
    this.fixMouse(event),
    this.draw.hitThreshold
  );

  // TODO: don't go dirty every time
  this.draw.dirty();
};
