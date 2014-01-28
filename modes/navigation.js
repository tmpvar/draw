function NavigationMode(modeManager, draw) {
  DrawMode.call(this, modeManager);

  this.draw = draw;
}

NavigationMode.prototype = Object.create(DrawMode.prototype);

NavigationMode.prototype.mousemove = function() {
  
  return true;
};

NavigationMode.prototype.mousedown = function() {

  return true;
};


NavigationMode.prototype.keydown = function(event) {

  switch (event.keyCode) {
    case 76: // (l)ine
      this.modeManager.mode('line');
      return true;
    break;

    case 67: // (c)ircle
      return this.modeManager.mode('circle');
    break;

    case 27: // escape
      if (this.modeManager.mode() !== 'default') {
        this.modeManager.mode('default');
        return true;
      }
    break;
  }

  return true;
};


