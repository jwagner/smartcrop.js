// prepare base perf object
if (typeof window.performance === 'undefined') {
  window.performance = {};
}

if (!window.performance.now) {
  var nowOffset = Date.now();

  if (performance.timing && performance.timing.navigationStart) {
    nowOffset = performance.timing.navigationStart;
  }

  window.performance.now = function now() {
      return Date.now() - nowOffset;
    };
}

var processed = {};
var options = {debug: true, width: 250, height: 250};
$.getJSON('images/images.json', function(images) {
  $('body').append(images.map(function(image) {
    return $('<div>')
        .append($('<img>').attr('src', image.url))
        .append(
          $('<div class=testsuite-image-title>')
            .append($('<a>').text(image.name).attr('href', image.href))
            .append($('<span class=test-suite-image-attribution>').text(' by ' + image.attribution)));
  }));

  var totalTime = 0;
  var totalmpix = 0;
  var totalCrops = 0;

  $('img').each(function() {
    $(this).load(function() {
      window.setTimeout(function() {
        var img = this;
        if (processed[img.src]) return;
        processed[img.src] = true;
        var t = performance.now();
        smartcrop.crop(img, options, function(result) {
          totalTime += (performance.now() - t) / 1e3;
          totalmpix += (img.naturalWidth * img.naturalHeight) / 1e6;
          totalCrops++;
          $('#perf').text('processed ' + totalCrops + ' images, ' +
            Math.round(totalTime * 1000 / totalCrops) + ' ms/image, ' +
            Math.round(100 * totalmpix / totalTime) / 100 + ' mega pixel/s');
          // console.log(img.src, result);
          var crop = result.topCrop;
          var canvas = $('<canvas>')[0];
          var ctx = canvas.getContext('2d');
          canvas.width = options.width;
          canvas.height = options.height;
          ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

          $(img)
            .after(canvas)
            .after(debugDraw(result, true));
          //  .parent()
          //  .append($('<pre>').text(JSON.stringify(crop.score)));
        });
      }.bind(this), 100);
    });
    if (this.complete) {
      $(this).load();
    }
  });
});
