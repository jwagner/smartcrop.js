(function() {
  var canvas = $('canvas')[0];
  var form = document.forms[0];
  var ctx = canvas.getContext('2d');
  var img;

  $('html')
    .on('dragover', function(e) {
      e.preventDefault();
      return false;
    })
    .on('drop', function(e) {
      var files = e.originalEvent.dataTransfer.files;
      handleFiles(files);
      return false;
    });

  $('input[type=file]').change(function() {
    handleFiles(this.files);
  });

  function handleFiles(files) {
    if (files.length > 0) {
      var file = files[0];
      if (
        typeof FileReader !== 'undefined' &&
        file.type.indexOf('image') != -1
      ) {
        var reader = new FileReader();
        // Note: addEventListener doesn't work in Google Chrome for this event
        reader.onload = function(evt) {
          load(evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  load('images/unsplash/makhmutova-dina-1580313-unsplash.jpg');

  $('input[type=range]').on(
    'input',
    _.debounce(function() {
      $(this)
        .next('.value')
        .text($(this).val());
      run();
    }, 500)
  );

  $('input[type=radio], input[type=checkbox]').on(
    'change',
    _.debounce(function() {
      run();
    })
  );

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
      debug: true
    };

    var faceDetection = $('input[name=faceDetection]:checked', form).val();
    var analyzeOptions = analyze.bind(this, options);

    if (faceDetection === 'tracking') {
      faceDetectionTracking(options, analyzeOptions);
    } else if (faceDetection === 'jquery') {
      faceDetectionJquery(options, analyzeOptions);
    } else if (faceDetection === 'opencv') {
      faceDetectionOpenCV(options, analyzeOptions);
    } else if (faceDetection === 'face-api') {
      faceDetectionFaceAPI(options, analyzeOptions);
    } else {
      analyzeOptions();
    }
  }

  function prescaleImage(image, maxDimension, callback) {
    // tracking.js is very slow on big images so make sure the image is reasonably small
    var width = image.naturalWidth || image.width;
    var height = image.naturalHeight || image.height;
    if (width < maxDimension && height < maxDimension)
      return callback(image, 1);
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

  var getFaceAPIDetector = _.memoize(function() {
    return faceapi.nets.tinyFaceDetector.loadFromUri('face-api');
  });

  function faceDetectionFaceAPI(options, callback) {
    getFaceAPIDetector()
      .then(
        function() {
          return faceapi.tinyFaceDetector(img);
        },
        function(err) {
          console.error(err);
          alert('Could not load models');
        }
      )
      .then(
        function(faces) {
          options.boost = faces.map(function(face) {
            var box = face.box;
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              weight: 1.0
            };
          });
          callback(options);
        },
        function(err) {
          console.error(err);
          alert('could not detectAllFaces');
        }
      );
  }

  function faceDetectionOpenCV(options, callback) {
    prescaleImage(img, 768, function(img, scale) {
      var src = cv.imread(img);
      var gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      var faces = new cv.RectVector();
      var faceCascade = new cv.CascadeClassifier();
      // load pre-trained classifiers
      faceCascade.load('haarcascade_frontalface_default.xml');
      console.log(faceCascade);
      // detect faces
      var msize = new cv.Size(0, 0);
      faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
      options.boost = [];
      for (var i = 0; i < faces.size(); ++i) {
        var face = faces.get(i);
        options.boost.push({
          x: face.x / scale,
          y: face.y / scale,
          width: face.width / scale,
          height: face.height / scale,
          weight: 1.0
        });
      }
      src.delete();
      gray.delete();
      faceCascade.delete();
      faces.delete();
      callback(options);
    });
  }

  function faceDetectionTracking(options, callback) {
    prescaleImage(img, 768, function(img, scale) {
      var tracker = new tracking.ObjectTracker('face');
      tracking.track(img, tracker);
      tracker.on('track', function(event) {
        console.log(
          'tracking.js detected ' + event.data.length + ' faces',
          event.data
        );
        options.boost = event.data.map(function(face) {
          return {
            x: face.x / scale,
            y: face.y / scale,
            width: face.width / scale,
            height: face.height / scale,
            weight: 1.0
          };
        });

        callback(options);
      });
    });
  }

  function faceDetectionJquery(options, callback) {
    $(img).faceDetection({
      complete: function(faces) {
        if (faces === false) {
          return console.log('jquery.facedetection returned false');
        }
        console.log(
          'jquery.facedetection detected ' + faces.length + ' faces',
          faces
        );
        options.boost = Array.prototype.slice
          .call(faces, 0)
          .map(function(face) {
            return {
              x: face.x,
              y: face.y,
              width: face.width,
              height: face.height,
              weight: 1.0
            };
          });

        callback(options);
      }
    });
  }

  function analyze(options) {
    console.log('analyze', options);
    smartcrop.crop(img, options, draw);
  }

  function draw(result) {
    var selectedCrop = result.topCrop;
    $('.crops')
      .empty()
      .append(
        _.sortBy(result.crops, function(c) {
          return -c.score.total;
        }).map(function(crop) {
          return $('<p>')
            .text(
              'Score: ' +
                ~~(crop.score.total * 10000000) +
                ', ' +
                crop.x +
                'x' +
                crop.y
            )
            .hover(
              function() {
                drawCrop(crop);
              },
              function() {
                drawCrop(selectedCrop);
              }
            )
            .click(function() {
              selectedCrop = crop;
              drawCrop(selectedCrop);
            })
            .data('crop', crop);
        })
      );

    drawCrop(selectedCrop);
    $('#debug')
      .empty()
      .append(debugDraw(result, true));
  }

  function drawCrop(crop) {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
  }

  window.openCvReady = function() {
    console.log('opencv code ready');
    loadCascade(
      'haarcascade_frontalface_default.xml',
      'https://unpkg.com/opencv.js@1.2.1/tests/haarcascade_frontalface_default.xml',
      function() {
        console.log('opencv ready');
        document.querySelector('.opencv-loading input').disabled = false;
        document.querySelector('.opencv-loading').className = '';
      }
    );
  };

  function loadCascade(path, url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          var data = new Uint8Array(request.response);
          cv.FS_createDataFile('/', path, data, true, false, false);
          callback();
        } else {
          self.printError(
            'Failed to load ' + url + ' status: ' + request.status
          );
        }
      }
    };
    request.send();
  }
})();
