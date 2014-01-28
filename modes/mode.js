function Mode(modeManager, draw) {
  this.modeManager = modeManager;
  this.draw = draw;
}

Mode.prototype.exit = function() {
  this.modeManager.exit();
};

Mode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return event && this[type](event);
  }
};