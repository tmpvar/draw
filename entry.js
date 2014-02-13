var ctx = fc(function(delta) {
  ctx.clear('#111122');

  ctx.save();
    draw.render(ctx, delta);
  ctx.restore();
}, false);

var draw = new Draw(ctx.canvas, ctx, ctx.dirty);

var background = document.createElement('canvas')

var bctx = background.getContext('2d');
background.width = 12;
background.height = 12;

bctx.lineWidth = 8;
bctx.strokeStyle = 'rgba(255,255,255,.1)';
bctx.lineCap = 'square';
bctx.beginPath()
  bctx.moveTo(-10, background.height/2);
  bctx.lineTo(background.width+10, background.height/2);
bctx.closePath()

  bctx.stroke();
ctx.fillBackground = ctx.createPattern(background, 'repeat');




window.addEventListener('resize', ctx.dirty);

draw.fixMouse = function(e) {
  return new Point(
    (e.x - ctx.canvas.width/2)/draw.scale + draw.translation.x/draw.scale,
    (e.y - ctx.canvas.height/2)/draw.scale + draw.translation.y/draw.scale
  );
};

['mousemove', 'mousedown', 'mouseup', 'keydown'].forEach(function(name) {
  window.addEventListener(name, draw.handle.bind(draw, name));
});

