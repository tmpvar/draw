function NavigationMode(modeManager, draw) {
  this.modeManager = modeManager;
  this.draw = draw;
}

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

NavigationMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};

