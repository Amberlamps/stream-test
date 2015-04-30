var body = $("body");
body.empty();
var list = $("<ul>");
body.append(list);

var url = '/api';

function jQueryCall() {

  $.ajax({
    url: url,
    type: 'get',
    success: onSuccess,
    error: onError
  });

  function onSuccess(data, message, response) {

    list.empty();
    data.data.forEach(paintElement);

  }

  function onError() {
    console.log("error");
  }

}

function paintElement(element) {
  var li = $("<li>");
  li.text(element.title);
  list.append(li);
}

function oboeCall() {

  oboe(url).node('data.*', paintElement);

}

oboeCall();
//jQueryCall();