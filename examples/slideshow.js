jQuery(function($) {

  var transitionend = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd';

  var slide = $('#slide');
  var prevSlide = $('#prev-slide');
  var images = [];
  var width = slide.width();
  var height = slide.height();

  for (var i = 0; i < 8; i++) {
    images.push({url: 'images/slideshow/' + i + '.jpg'});
  }

  function loadImage(src) {
    var d = Q.defer();
    var i = new Image();

    i.onload = function() {
      d.resolve(i);
    };
    i.onerror = function(e) {
      d.reject(e);
    };
    i.src = src;
    return d.promise;
  }

  function smartcrop(img, options) {
    var d = Q.defer();
    smartcrop.crop(img, options, d.resolve.bind(d));
    return d.promise;
  }

  function slideShow(images) {
    var analysed = 0;
    var i = 0;

    function next() {
      showSlide(images[i], next);
      i = (i + 1) % images.length;
    }

    images = _.chain(images)
        .shuffle()
        .head(10)
        .value();

    Q.all(images.map(function(i) {
      return loadImage(i.url).then(function(img) {
        i.img = img;
        var options = {width: width * 0.1, height: height * 0.1, ruleOfThirds: false};
        return Q.all([
                smartcrop(img, _.extend({maxScale: 0.8, minScale: 0.7}, options)).then(function(result) {
                  i.from = result;
                }),
                smartcrop(img, _.extend({minScale: 1}, options)).then(function(result) {
                  i.to = result;
                }),
            ]);
      });
    })).then(next);
  }

  function showSlide(image, done) {
    var img = image.img;
    function transform(crop) {
      var s = width / crop.width;
      var x = crop.x;
      var y = crop.y;
      var t = 'scale(' + s + ') translate(-' + x + 'px, -' + y + 'px)';
      return {
        '-webkit-transform': t,
        transform: t,
        '-webkit-transform-origin': '0 0',
        'transform-origin': '0 0',
      };
    }

    // zooming out usually works better, but some change is good too
    if ((image.from.topCrop.score.total + 0.1) * 1.002 > (image.to.topCrop.score.total + 0.1)) {
      from = image.from;
      to = image.to;
    }
    else {
      from = image.to;
      to = image.from;
    }
    window.from = from;
    window.to = to;
    var last = $('img', slide);
    if (last[0]) {
      prevSlide.empty().append(
          last.remove()
      );
      last.width();
      last.css('opacity', '0');
    }
    slide
        .empty()
        .append(img);
    $(img)
        .css(transform(from.topCrop))
        .css('opacity', 1)
        .width(); // reflow
    $(img)
        .on(transitionend, _.once(done))
        .css(transform(to.topCrop));

    img.onerror = done;
    img.src = image.url;
  }

  slideShow(images);

});
