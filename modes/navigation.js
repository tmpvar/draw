function NavigationMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
}

NavigationMode.prototype = Object.create(Mode.prototype);

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
      this.modeManager.exit();
    break;
  }

  return true;
};


