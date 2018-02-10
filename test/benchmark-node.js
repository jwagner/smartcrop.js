// npm install microtime canvas
// then run from base directory:
// node test/benchmark-node.js
//
var Benchmark = require('benchmark'),
  fs = require('fs'),
  Canvas = require('canvas'),
  SmartCrop = require('../smartcrop');

var img = new Canvas.Image();
img.src = fs.readFileSync('examples/images/flickr/kitty.jpg');
function canvasFactory(w, h) {
  return new Canvas(w, h);
}
var benchmark = new Benchmark(
  'SmartCrop.crop()',
  function(deferred) {
    SmartCrop.crop(
      img,
      { width: 256, height: 256, canvasFactory: canvasFactory },
      function() {
        deferred.resolve();
      }
    );
  },
  {
    defer: true,
    onComplete: function() {
      console.log(benchmark.toString()); // eslint: ignore
    }
  }
).run();
