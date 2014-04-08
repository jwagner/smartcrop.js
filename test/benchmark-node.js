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
function canvasFactory(w, h){ return new Canvas(w, h); }
var benchmark = new Benchmark('SmartCrop.crop()', function(deferred){
        SmartCrop.crop(img, {width: 256, height: 256, canvasFactory: canvasFactory}, function(){
            deferred.resolve();
        });
    }, {
        defer: true,
        maxTime: 30,
        onCycle: function(){
            console.log(benchmark.toString());
            console.log((1/(benchmark.stats.mean+benchmark.stats.moe)).toFixed(2));
            console.log(benchmark.stats.mean.toFixed(3));
        },
        onComplete: function(){
            //console.log(benchmark.stats);
            console.log((1/(benchmark.stats.mean+benchmark.stats.moe)).toFixed(2));
            console.log((1/(benchmark.stats.mean)).toFixed(2));
            console.log(benchmark.stats.mean);
            console.log(benchmark.toString());
        }
    }).run();
