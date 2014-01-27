
function Point(x, y, color) {
  Vec2.call(this, x, y);
  this.color = [0, 255, 0, .2]
}
Point.prototype = new Vec2();

Point.prototype.width = 3;
Point.prototype.color = null;

Point.prototype.render = function(diff) {
  ctx.fillStyle = rgba(this.color);
  var stroke = this.color.slice();
  stroke[3] += .1;
  ctx.strokeStyle = rgba(stroke);

  if (hovering === this) {
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


Point.relationshipModes = {
  center : function(start, end) {
    var change = function() {
      var diff = end.subtract(start, true).add(end);
      this.set(diff.x, diff.y);
    }

    this.trackingMode = { name : "center", start: start, end: end };

    start.change(change.bind(this));
    end.change(change.bind(this));
  },

  along : function(point, start, end) {

    this.trackingMode = {
      name : "percent",
      start: start,
      end: end
    };

  },

  on : function(start, end) {
    // TODO: coincident means either exacl
    this.trackingMode = {
      name : "on",
      start: start,
      end: end
    };

    point.change(function() {
      if (!end) {
        this.set(point.x, point.y);
      } else {
        var diff = end.subtract(start, true);
        var length = diff.length();
        diff.normalize();

        diff.multiply(length*percent).add(start);
        this.set(diff.x, diff.y);
      }
    }.bind(this));
  }
}