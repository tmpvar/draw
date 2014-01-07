
// TODO: don't reach across the global
module.exports = function(paths, offset, scale, materialHeight, depthPerPass, feed, workCoords) {
  var out = [
    '$H',
    'M4 S2000',
    'G4 P5',
    'M4 S100',
    'G10 L20 P1 X0 Y0 Z0',
    'G21G17',
    'G1 X' + workCoords.x + ' Y' + workCoords.y + ' F4000',
    'G1 Z' + workCoords.z,
    'G10 L20 P1 X0 Y0 Z0',
    'G28.1 X0 Y0 Z0',
    'G1 Z5' 
  ];
  var pass = [];
  paths.forEach(function(points) {
    var offset = Polygon(points).rewind(true).dedupe().clone().scale(scale).offset(offset);
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

    out.push('G1Z5F2000');
    out.push(pass[0]);

    for (var i=depthPerPass; i<=materialHeight+depthPerPass/2; i+=depthPerPass) {
      out.push('G1 Z-' + i + ' F200');
      out = out.concat(pass);
    }

    out.push('Z' + Math.abs(workCoords.z));
    out.push('G4 P2');
    out.push('M5');
    out.push('$h');

    console.log(out.join('\n'));

  });
}