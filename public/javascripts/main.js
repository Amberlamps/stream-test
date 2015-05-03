function buttonClick() {
  var button = $(this);
  var method = button.attr('data-method');
  var url = button.attr('data-url');
  var container = this;
  while (!container.className.match(/test\-case/) && container.nodeName !== 'BODY') {
    container = container.parentNode;
  }
  container = $(container);
  var items = container.find('.test-items').val();
  StreamTest(methods[method], urls[url], items, container);
}

function jQueryCall(url, paintElement, callback) {
  $.ajax({
    url: url,
    type: 'get',
    success: onSuccess,
    error: callback
  });
  function onSuccess(data, message, response) {
    data.data.forEach(paintElement);
    callback();
  }
}

function oboeCall(url, paintElement, callback) {
  oboe(url).node('data.*', paintElement).done(callback).fail(callback);
}

function StreamTest(method, url, items, container) {
  if (!(this instanceof StreamTest)) {
    return new StreamTest(method, url, items, container);
  }
  this.method = method;
  this.url = url;
  this.items = items;
  this.container = container;
  this.list = this.container.find('.test-data');
  this.list.empty();
  this.firstPaint = true;
  this.run();
}

StreamTest.prototype.run = function run() {

  this.start = Date.now();
  this.container.find('.test-button').attr('disabled', 'disabled').val('loading...');
  this.method(this.url + '?items=' + this.items, this.paintElement.bind(this), this.lastPaint.bind(this));

};

StreamTest.prototype.paintElement = function paintElement(element) {
  if (this.firstPaint) {
    this.container.find('.test-first').text((Date.now() - this.start) + ' ms');
    this.firstPaint = false;
  }
  var li = $("<li>");
  li.text(element.name);
  this.list.append(li);
};

StreamTest.prototype.lastPaint = function lastPaint(err) {
  if (err) {
    console.error(err);
  }
  this.container.find('.test-last').text((Date.now() - this.start) + ' ms');
  this.container.find('.test-button').val('Run Test')[0].removeAttribute('disabled');
}

var urls = {
  callback: '/api/callback',
  stream: '/api/stream'
};

var methods = {
  jQuery: jQueryCall,
  oboe: oboeCall
};

$('.test-button').click(buttonClick);

