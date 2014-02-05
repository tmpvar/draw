function Hit(thing, point, distance) {
  this.thing = thing;
  this.point = point;
  this.distance = distance;
}

var collectHits = function(array, vec, hitThreshold) {
  var l = array.length;
  var hits = [];

  for (var i = 0; i<l; i++) {
    array[i].hit(vec, hitThreshold)
        .filter(Boolean)
        .map(function(hit) {
          hits.push(hit)
        });
  }

  return hits.sort(function(a, b) {
    return (a.distance < b.distance) ? -1 : 1;
  });
};
