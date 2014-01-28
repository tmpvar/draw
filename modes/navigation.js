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

    case 27: // escape
      this.modeManager.exit();
      return true;
    break;
  }

};


