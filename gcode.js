
// TODO: don't reach across the global
window.gcode = function(offset, scale, materialHeight, depthPerPass, feed) {
  var out = [];
  var pass = [];
  paths.forEach(function(points) {
    var offset = Polygon(points).rewind(true).dedupe().clone().scale(scale).offset(offsetAmount);
    var aabb = offset.aabb();
    console.log('bounds', aabb);
    offset.each(function(p, c) {
      var o = c.clone();
      if (aabb.x < 0) {
        o.add(Vec2(Math.abs(aabb.x), 0));
      }

      if (aabb.y < 0) {
        o.add(Vec2(0, Math.abs(aabb.y)));
      }

      pass.push('G1 X' + o.x + ' Y' + o.y + ' F' + feed);
    });

    for (var i=0; i<=materialHeight+depthPerPass/2; i+=depthPerPass) {
      out.push('G1 Z-' + i);
      out = out.concat(pass);
    }

    console.log(out);

  });
}