
function DrawDefaultMode(modeManager, draw) {
  this.modeManager = modeManager;
  this.draw = draw;
}

DrawDefaultMode.prototype.mousemove = function() {
  
  return true;
};

DrawDefaultMode.prototype.mousedown = function() {

  return true;
};


DrawDefaultMode.prototype.keydown = function(event) {

  switch (event.keyCode) {
    case 76: // (l)ine
      this.modeManager.mode('line');
      return true;
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


DrawDefaultMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};


function LineMode(modeManager, draw) {
  this.modeManager = modeManager;
  this.draw = draw;
  this.line = null;
}

LineMode.prototype.mousemove = function(event) {
  
  if (this.line) {
    console.log(event.x, event.y);
    this.line.end.set(event);
  }

  return true;
};

LineMode.prototype.mousedown = function(event) {

  // begin the line
  this.line = new Line(
    new Point(event.position.x, event.position.y),
    new Point(event.position.x, event.position.y)
  );

  this.draw.renderables.push(this.line);

  return true;
};

LineMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};

var requestFrame = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : setTimeout;

// TODO: allow running under node

function Draw() {
  this.modeManager = new ModeManager(true);
  this.scale = 1;
  this.modeManager.add('default', new DrawDefaultMode(this.modeManager, this), true);
  this.modeManager.add('line', new LineMode(this.modeManager, this));

  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.renderables = [];
  this.mouse = Vec2(0, 0);
}

Draw.prototype.renderables = null;
Draw.prototype.canvas = null;
Draw.prototype._dirty = false;
Draw.prototype.dirty = function() {
  if (!this._dirty) {
    this._dirty = true;
    requestFrame(this.render.bind(this), 0);
  }
};

Draw.prototype.render = function() {
  this._dirty = false;

  var w = this.canvas.width, ctx = this.ctx;
  this.canvas.width = 0;
  this.canvas.width = w;

  ctx.save();

    ctx.translate(this.canvas.width/2, this.canvas.height/2);

    for (var i = 0; i<this.renderables.length; i++) {
      ctx.save();
        this.renderables[i].render(ctx);
      ctx.restore();
    }

  ctx.restore();
}

Draw.prototype.canvasDimensions = function(w, h) {
  this.canvas.width = w;
  this.canvas.height = h;
};

Draw.prototype.keydown = function(event) {
  switch (event.keyCode) {
  }
};

Draw.prototype.handle = function(type, event) {
  if (this.modeManager.handle(type, event)) {
    this.dirty();
    return true;
  }
};

Draw.prototype.update = function(delta) {
  return this.modeManager.update(delta);
}

if (typeof module !== 'undefined' && module.exports) {
  module.expoers = Draw;
}

if (typeof window !== 'undefined') {
  window.Draw = Draw;
}