function DrawMode(modeManager) {
  this.modeManager = modeManager;
}

DrawMode.prototype.exit = function() {
  this.modeManager.exit();
};

DrawMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};