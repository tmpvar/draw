function CircleMode(modeManager, draw) {
  Mode.call(this, modeManager, draw);
}

CircleMode.prototype = Object.create(Mode.prototype);

CircleMode.prototype.circle = null;

CircleMode.prototype.keydown = function(event) {
  switch (event.keyCode) {
    case 27: // escape
      if (this.circle) {
        this.circle.helper = null;
        this.circle = null;
      } else {

        // second escape will take us back to navigation mode
        this.exit();
      }

      return true;
    break;
  }
}


CircleMode.prototype.mousemove = function(event) {
  if (event.position) {

    if (this.circle) {
      this.circle.radius(this.circle.position.distance(event.position));
      this.circle.helper.set(event.position);
    }
    return true;
  }
}


CircleMode.prototype.mousedown = function(event) {

  if (event.position) {

    if (this.circle) {
      this.circle.radius(this.circle.position.distance(event.position));
      this.draw.renderables.push(this.circle);
      this.circle.helper = null;
      this.circle = null;
    } else {
      this.circle = new Circle(new Point(event.position));
      this.circle.helper = new Point(event.position);
    }

    return true;
  }
};

CircleMode.prototype.update = function(ctx, deltaTime) {
  if (this.circle) {
    this.circle.render(ctx, deltaTime);
  }

};
