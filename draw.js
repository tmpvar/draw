
var requestFrame = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : setTimeout;

// TODO: allow running under node

function Draw(canvas, ctx, dirty) {

  this.dirty = dirty || this.dirty;
  this.modeManager = new ModeManager(true);
  this.scale = 1;
  this.translation = Vec2(0, 0);

  this.modeManager.add('navigation', new NavigationMode(this.modeManager, this), true);
  this.modeManager.add('line', new LineMode(this.modeManager, this));
  this.modeManager.add('circle', new CircleMode(this.modeManager, this));

  if (!canvas) {
    this.canvas = document.createElement('canvas');
  } else {
    this.canvas = canvas;
  }

  if (!ctx) {
    this.ctx = this.canvas.getContext('2d');
  } else {
    this.ctx = ctx;
  }

  this.renderables = [];
}

Draw.prototype.computeGeometry = function() {
  var ret = [];
  this.renderables.forEach(function(renderable) {
    renderable.computeGeometry(ret);
  });

  return ret;
};



Draw.prototype.fixMouse = function(pos) {
  pos.clone();
  pos.y = -pos.y;
  return pos;
};

Draw.prototype.renderables = null;
Draw.prototype.canvas = null;
Draw.prototype._dirty = false;
Draw.prototype.dirty = function() {
  if (!this._dirty) {
    this._dirty = true;
    requestFrame(this.render.bind(this), 0);
  }
};

Draw.prototype.clearCanvas = function() {
  var w = this.canvas.width;
  this.canvas.width = 0;
  this.canvas.width = w;
};

Draw.prototype.render = function(delta) {
  this._dirty = false;
  var ctx = this.ctx;

  ctx.save();

    ctx.translate(this.canvas.width/2, this.canvas.height/2);
    ctx.scale(this.scale, this.scale);

    this.update(delta);
    ctx.lineWidth = (1/this.scale)*2.5;

    for (var i = 0; i<this.renderables.length; i++) {
      ctx.save();
        this.renderables[i].render(ctx);
      ctx.restore();
    }

  ctx.restore();
};

Draw.prototype.canvasDimensions = function(w, h) {
  window.drawCanvas = this.canvas;
  this.canvas.width = w;
  this.canvas.height = h;
};

Draw.prototype.handle = function(type, event) {

  if (type.indexOf('mouse') > -1 && !event.position) {
    event.position = this.fixMouse(new Vec2(event));
  }

  if (this.modeManager.handle(type, event)) {

    this.dirty();
    return true;
  }
};

Draw.prototype.update = function(delta) {
  return this.modeManager.update(this.ctx, delta);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Draw;
}

if (typeof window !== 'undefined') {
  window.Draw = Draw;
}