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
  }
};


NavigationMode.prototype.mousemove = function(event) {

  var v = Vec2(event).divide(this.draw.scale, true).add(this.draw.translation).subtract(Vec2(this.draw.canvas.width/2, this.draw.canvas.height/2));
  var r = this.draw.renderables, l = r.length, dirty = false;

  for (var i = 0; i<l; i++) {
    dirty = dirty || r[i].hit(v);
  }

  if (dirty) {
    this.draw.dirty();
  }

};


