var ctx = fc(function(delta) {
  ctx.clear();

  ctx.save();
    draw.render(ctx, delta);
  ctx.restore();
}, false);

var draw = new Draw(ctx.canvas, ctx, ctx.dirty);

draw.fixMouse = function(e) {
  return Vec2(
    (e.x - ctx.canvas.width/2)/draw.scale + draw.translation.x/draw.scale,
    (e.y - ctx.canvas.height/2)/draw.scale + draw.translation.y/draw.scale
  );
};

['mousemove', 'mousedown', 'mouseup', 'keydown'].forEach(function(name) {
  window.addEventListener(name, draw.handle.bind(draw, name));
});

