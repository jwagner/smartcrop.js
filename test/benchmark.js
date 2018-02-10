(function() {
  var KITTY = '/examples/images/flickr/kitty.jpg',
    raw = $('#raw'),
    status = $('#status');

  var benchmark = new Benchmark(
      'smartcrop.crop()',
      function(deferred) {
        smartcrop.crop(img, { width: 256, height: 256 }, function() {
          deferred.resolve();
        });
      },
      {
        defer: true,
        maxTime: 30,
        onCycle: function() {
          status.text(benchmark.toString());
        },
        onComplete: function() {
          console.log('complete', arguments);
          status.text(benchmark.toString());
          raw.text(JSON.stringify(benchmark.stats, null, ' '));
        }
      }
    ),
    img = new Image();
  // add tests
  img.src = KITTY;
  img.onload = function() {
    benchmark.run({ async: true });
  };
})();
