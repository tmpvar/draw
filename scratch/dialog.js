function Field(label, type, initialValue) {
  if (!(this instanceof Field)) {
    return new Field(label, type, initialValue);
  }

  this._value = initialValue;
  this._type = type;
  this._label = label;
}

Field.prototype.createDOM = function(doc) {

  this.groupElement = doc.createElement('section');
  this.groupElement.setAttribute('class', 'field-wrapper');

  this.labelElement = doc.createElement('span');
  this.labelElement.innerHTML = this.label();

  this.inputElement = doc.createElement('input');
  this.inputElement.type = 'text';
  this.inputElement.value = this.value();

  this.groupElement.appendChild(this.labelElement);
  this.groupElement.appendChild(this.inputElement);

  this.groupElement.field = this;
  this.labelElement.field = this;
  this.inputElement.field = this;

  this._listeners = [];

  return this.groupElement;
};

Field.prototype.change = function(fn) {
  if (typeof fn === 'function') {
    this._listeners.push(fn);
    return fn;
  }
  throw new Error('not a function');
};

Field.prototype.notify = function() {
  var fns = this._listeners, l = fns.length;
  for (var i = 0; i<l; i++) {
    fns[i](this);
  }
};

Field.prototype.value = function(val) {
  if (typeof val !== 'undefined') {
    var cleaned = this[this.type()](val);

    if (this._value !== cleaned) {

      this._value = cleaned;
      if (val !== this.inputElement.value) {
        this.inputElement.value = cleaned;
      }
      this.notify();
    }
  }
  return this._value;
};

Field.prototype.label = function(label) {
  if (typeof label !== 'undefined') {
    this._label = label;
    this.label.innerHTML = label;
  }
  return this._label;
};

Field.prototype.type = function(type) {
  if (typeof type !== 'undefined') {
    this._type = type;
    this.inputElement.value = this[type](this.input.value);
  }
  return this._type;
};

Field.prototype.onkeyup = function(ev) {
  this.value(this.inputElement.value);
};

Field.prototype.onfocus = function(ev) {
  this.inputElement.select();
  this.groupElement.className += ' focused'
};

Field.prototype.onblur = function(ev) {
  this.groupElement.className = this.groupElement.className.replace(' focused', '');
};

Field.prototype.eventHandler = function(ev) {
  var name = 'on' + ev.type;

  if (typeof this[name] === 'function') {
    this[name](ev);
  }
};

Field.prototype.createFloat = function(val) {
  val = parseFloat(val);
  if (isNaN(val)) {
    val = 0.0;
  }
  return val;
};

Field.prototype.createInt = function(val) {
  return parseInt(val, 10);
};

Field.prototype.createString = function(val) {
  return val.toString();
};


Field.FLOAT = 'createFloat';
Field.NUMBER = 'createFloat';
Field.INTEGER = 'createInt';
Field.STRING = 'createString';

function Action(text) {
  this.text = text;
}

// This is what you override.
// Obj is the form serialized
Action.prototype.perform = function(obj) {

};

function Dialog(title, fields, actions, doc) {

  if (!(this instanceof Dialog)) {
    return new Dialog(title, fields, actions, doc);
  }

  fields = fields || [];

  if (!doc) {
    doc = window.document;
  }

  this.document = doc;
  this.el = doc.createElement('section');

  this.fieldContainer = doc.createElement('section')
  this.fieldContainer.setAttribute('class', 'field-container');

  var h1 = doc.createElement('h1');
  h1.innerHTML = title;
  this.el.appendChild(h1);
  this.el.appendChild(this.fieldContainer);

  var l = fields.length;
  this._fields = fields;
  for (var i=0; i<l; i++) {
    this.addField(fields[i]);
  }

  this.position = new Vec2();
  this.position.change(this.moveTo.bind(this));

  this.bindEvents();
};

Dialog.prototype.change = function(fields, callback) {

  var collected = this._fields.filter(function(field) {
    return fields.indexOf(field.label()) > -1;
  });

  var handler = function() {
    callback.apply(this, collected);
  };

  var l = collected.length;
  for (var i = 0; i<l; i++) {
    collected[i].change(handler);
  }
};

Dialog.prototype.moveTo = function(vec) {
  this.el.style.left = vec.x;
  this.el.style.top = vec.y;
};

Dialog.prototype.activate = function(parentEl) {
  this.parentElement = parentEl;
  parentEl.style.display = "block";
  parentEl.appendChild(this.el);
};

Dialog.prototype.deactivate = function() {
  this.parentElement.removeChild(this.el);
  this.parentElement.style.display = "none";
};

Dialog.prototype.addField = function(field) {
  this.fieldContainer.appendChild(field.createDOM(this.document));
};

Dialog.prototype.handleEvent = function(ev) {
  if (ev.target.field) {
    ev.target.field.eventHandler(ev);
  }
};

Dialog.prototype.bindEvents = function() {
  var events = [
    'mousedown',
    'mousemove',
    'mouseup',
    'change',
    'keydown',
    'keyup',
    'focus',
    'blur'
  ];

  for (var i=0; i<events.length; i++) {
    this.el.addEventListener(events[i], this.handleEvent.bind(this), true);
  }
};