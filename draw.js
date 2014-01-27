
var requestFrame = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : setTimeout;

// TODO: allow running under node

function Draw() {
  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.renderables = [];
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

    ctx.fillStyle = "red";
    ctx.fillRect(-49, -49, 98, 98);

  ctx.restore();
}

Draw.prototype.canvasDimensions = function(w, h) {
  this.canvas.width = w;
  this.canvas.height = h;
};


Draw.prototype.mousemove = function() {


  this.dirty();
};

Draw.prototype.mousedown = function() {


  this.dirty();
};

Draw.prototype.keydown = function(event) {
  switch (event.keyCode) {
  }
};

Draw.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};



if (typeof module !== 'undefined' && module.exports) {
  module.expoers = Draw;
}

if (typeof window !== 'undefined') {
  window.Draw = Draw;
}