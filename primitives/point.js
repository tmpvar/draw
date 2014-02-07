
var rgba = function(array) {
  return 'rgba(' + array.join(',') + ')';
};

var fromRgba = function(string) {
  return string
          .replace(/[^\(]+/, '')
          .replace(')', '')
          .replace(/ /g, '').split(',');
}


function Point(x, y, color) {
  Vec2.call(this, x, y);
  this.color = [0, 255, 0, .2]
}
Point.prototype = Object.create(Vec2.prototype);
Point.prototype.constructor = Point;

Point.prototype.width = 2;
Point.prototype.color = null;
Point.prototype.hovered = false;


Point.prototype.render = function(ctx) {
  ctx.fillStyle = rgba(this.color);
  var stroke = this.color.slice();
  stroke[3] += .1;
  ctx.strokeStyle = rgba(stroke);

  if (this.hovered) {
    ctx.beginPath();
      ctx.arc(this.x, this.y, this.width*2.5, TAU, false);
    ctx.closePath();
  } else {
    ctx.beginPath();
     ctx.arc(this.x, this.y, this.width, TAU, false);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.fill();
}

Point.prototype.isAutoCentering = false
Point.prototype.autoCenter = function(start, end) {
  this.isAutoCentering = [start, end];
  var handler = function() {
    var n = end.subtract(start, true).divide(2).add(start);
    this.set(n.x, n.y);
  }.bind(this);

  start.change(handler);
  end.change(handler);
};

Point.prototype.hit = function(vec, threshold) {
  var dist = this.distance(vec);
  var hit = dist < threshold;
  this.hovered = hit;

  if (hit) {
    return new Hit(this, this, dist);
  }

  return false;
};

Point.prototype.move = function(vec) {
  this.add(vec);
};
