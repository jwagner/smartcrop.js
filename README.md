smartcrop.js
============

[![GitHub Stars](https://img.shields.io/github/stars/jwagner/smartcrop.js.svg?style=flat-square)](https://github.com/jwagner/smartcrop.js/stargazers) [![GitHub Issues](https://img.shields.io/github/issues/jwagner/smartcrop.js.svg?style=flat-square)](https://github.com/jwagner/smartcrop.js/issues) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/jwagner/smartcrop.js/blob/master/LICENSE)

Smartcrop.js implements an algorithm to find good crops for images.

![Example](http://29a.ch/sandbox/2014/smartcrop/example.jpg)
> Image: [https://www.flickr.com/photos/endogamia/5682480447/](https://www.flickr.com/photos/endogamia/5682480447) by N. Feans


## Demos
* [Test Suite](http://29a.ch/sandbox/2014/smartcrop/examples/testsuite.html) - contains over 100 images (**heavy**)
* [Test Bed](http://29a.ch/sandbox/2014/smartcrop/examples/testbed.html) - allows you to upload your own images
* [Photo transitions](http://29a.ch/sandbox/2014/smartcrop/examples/slideshow.html) - automatically creates Ken Burns transitions for a slide show.


## Algorithm Overview
Smartcrop.js works using fairly dumb image processing logic. The basics of the proccess consists of:

1. Find edges using laplace
1. Find regions with a color similar to skin
1. Find regions that are high in saturation
1. Generate a set of candidate crops using a sliding window
1. Rank them using an importance function to centralize detail and prevent it from being in the edges of the crop
1. Output the candidate crop with the highest rank


## Simple Example
```javascript
SmartCrop.crop(image, {
    width: 100,
    height: 100
  }, function(result) {
    console.log(result);
    }
);
// {topCrop: {x: 300, y: 200, height: 200, width: 200}}
```


## Download / Installation
To install smartcrop.js, you can both run ```$ npm install smartcrop``` or ```$ bower install smartcrop```

or you can [get it](https://raw.githubusercontent.com/jwagner/smartcrop.js/master/smartcrop.js) directly from its GitHub repository


## CLI / Node.js
The [smartcrop-cli](https://github.com/jwagner/smartcrop-cli) module offers a command line interface to smartcrop.js. It is based on node.js and node-canvas. You can also view it as an example on how to use smartcrop.js from a node.js app


## Module Formats
Supported:
* CommonJS
* AMD
* Global Export / Window


## Supported Browsers
Smartcrop.js requires `canvas` to work properly. Check [caniuse.com/canvas](http://caniuse.com/canvas) to see the compatible browsers


## API
> The API is not yet finalized. Look at the code for details and expect changes.

#### SmartCrop.crop(image, options, callback)
> Crop image using options and call callback(result) when done.

**image:** anything ctx.drawImage() accepts, usually HTMLImageElement, HTMLCanvasElement or HTMLVideoElement

**options:** see cropOptions

**callback:** function(cropResult)


#### cropOptions
> There are many more (for now undocumented) options available. Check the [source](smartcrop.js#L32) and be aware that they might change in the future.

**debug:** if true, cropResults will contain a debugCanvas

**minScale:** minimal scale of the crop rect, set to 1.0 to prevent smaller than necessary crops (lowers the risk of chopping things off)

**width:** width of the crop you want to use

**height:** height of the crop you want to use


#### cropResult
```javascript
{
  topCrop: crop,
  crops: [crop]
}
```

#### crop
```javascript
{
  x: 1,
  y: 1,
  width: 1,
  height: 1
}
```


## Tests
You can run the tests using grunt test. Alternatively you can also just run grunt (the default task) and open http://localhost:8000/test/. 
The test coverage for smartcrop.js is very limited at the moment. I expect to improve this as the code matures and the concepts solidify.


## Benchmark
There are benchmarks for both the browser (test/benchmark.html) and node (node test/benchmark-node.js [requires node-canvas])
both powered by [benchmark.js](http://benchmarkjs.com).

If you just want some rough numbers: It takes **< 100 ms** to find a square crop of a **640x427px** picture on an Intel i7.
In other words, it's fine to run it on one image, but not so cool to run it on an entire gallery on page load.


## Contributors
* [Christian Muehlhaeuser](https://github.com/muesli)


## Ports & Alternatives
* [connect-thumbs](https://github.com/inadarei/connect-thumbs) by [Irakli Nadareishvili](https://github.com/inadarei/connect-thumbs) - middleware for connect.js that supports smartcrop.js
* [smartcrop.go](https://github.com/muesli/smartcrop) by [Christian Muehlhaeuser](https://github.com/muesli)
* [smartcrop.py](https://github.com/hhatto/smartcrop.py) by [Hideo Hattori](http://www.hexacosa.net/about/)


## License
Copyright (c) 2014 Jonas Wanger, licensed under the MIT License (enclosed)
