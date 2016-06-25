(function() {

var canvas = $('canvas')[0];
var form = document.forms[0];
var ctx = canvas.getContext('2d');
var img, crop;

$('html')
    .on('dragover', function(e) {e.preventDefault(); return false;})
    .on('drop', function(e) {
      var files = e.originalEvent.dataTransfer.files;
      handleFiles(files);
      return false;
    });

$('input[type=file]').change(function(e) { handleFiles(this.files); });

function handleFiles(files) {
  if (files.length > 0) {
    var file = files[0];
    if (typeof FileReader !== 'undefined' && file.type.indexOf('image') != -1) {
      var reader = new FileReader();
      // Note: addEventListener doesn't work in Google Chrome for this event
      reader.onload = function(evt) {
        load(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
}

load('images/flickr/kitty.jpg');

$('input[type=range]').on('input', _.debounce(function() {
  $(this).next('.value').text($(this).val());
  run();
}, 500));

$('input[type=radio], input[type=checkbox]').on('change', _.debounce(function() {
  run();
}));


function load(src) {
  img = new Image();
  img.onload = function() {
    run();
  };
  img.src = src;
}

function run() {
  if (!img) return;
  var options = {
    width: form.width.value * 1,
    height: form.height.value * 1,
    minScale: form.minScale.value * 1,
    ruleOfThirds: form.ruleOfThirds.checked,
    debug: true,
  };

  var faceDetection = $('input[name=faceDetection]:checked', form).val();

  if (faceDetection === 'tracking') {
    faceDetectionTracking(options, function() {
      analyze(options);
    });

  }
  else if (faceDetection === 'jquery') {
    faceDetectionJquery(options, function() {
      analyze(options);
    });
  }
  else {
    analyze(options);
  }
}

function prescaleImage(image, maxDimension, callback) {
  // tracking.js is very slow on big images so make sure the image is reasonably small
  var width = image.naturalWidth || image.width;
  var height = image.naturalHeight || image.height;
  if (width < maxDimension && height < maxDimension) return callback(image, 1);
  var scale = Math.min(maxDimension / width, maxDimension / height);
  var canvas = document.createElement('canvas');
  canvas.width = ~~(width * scale);
  canvas.height = ~~(height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  var result = document.createElement('img');
  result.onload = function() {
    callback(result, scale);
  };
  result.src = canvas.toDataURL();
}

function faceDetectionTracking(options, callback) {
  prescaleImage(img, 768, function(img, scale) {
    var tracker = new tracking.ObjectTracker('face');
    tracking.track(img, tracker);
    tracker.on('track', function(event) {
      console.log('tracking.js detected ' + event.data.length + ' faces', event.data);
      options.boost = event.data.map(function(face) {
        return {
          x: face.x / scale,
          y: face.y / scale,
          width: face.width / scale,
          height: face.height / scale,
          weight: 1.0
        };
      });

      callback();
    });
  });
}

function faceDetectionJquery(options, callback) {
  $(img).faceDetection({
    complete: function(faces) {
      if (faces === false) { return console.log('jquery.facedetection returned false'); }
      console.log('jquery.facedetection detected ' + faces.length + ' faces', faces);
      options.boost = Array.prototype.slice.call(faces, 0).map(function(face) {
        return {
          x: face.x,
          y: face.y,
          width: face.width,
          height: face.height,
          weight: 1.0
        };
      });

      callback();
    }
  });
}

function analyze(options) {
  console.log(options);
  smartcrop.crop(img, options, draw);
}

function draw(result) {
  selectedCrop = result.topCrop;
  $('.crops')
    .empty()
    .append(
      _.sortBy(result.crops, function(c) {return -c.score.total;})
        .map(function(crop) {
          return $('<p>')
              .text('Score: ' + ~~(crop.score.total * 10000000) + ', ' + crop.x + 'x' + crop.y)
                  .hover(function() {
                    drawCrop(crop);
                  }, function() {
                    drawCrop(selectedCrop);
                  })
                  .click(function() { selectedCrop = crop; drawCrop(selectedCrop); })
                  .data('crop', crop);
        })
      );

  drawCrop(selectedCrop);
  $('#debug').empty().append(debugDraw(result, true));
}

function drawCrop(crop) {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 4;
  ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
}

})();
