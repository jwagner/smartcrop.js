# smartcrop.js

Smartcrop.js implements an algorithm to find good crops for images.

![Example](http://29a.ch/sandbox/2014/smartcrop/example.jpg)
Image: [https://www.flickr.com/photos/endogamia/5682480447/](https://www.flickr.com/photos/endogamia/5682480447) by N. Feans

## Demos
* [Test Suite](http://29a.ch/sandbox/2014/smartcrop/examples/testsuite.html), contains over 100 images, **heavy**
* [Test Bed](http://29a.ch/sandbox/2014/smartcrop/examples/testbed.html), allows you to upload your own images
* [Photo transitions](http://29a.ch/sandbox/2014/smartcrop/examples/slideshow.html), automatically creates Ken Burns transitions for a slide show.

## Algorithm Overview
Smartcrop.js works using fairly dumb image processing. In short:

1. Find edges using laplace
1. Find regions with a color like skin
1. Find regions high in saturation
1. Generate a set of candidate crops using a sliding window
1. Rank them using an importance function to focus the detail in the center
  and avoid it in the edges. 
1. Output the candidate crop with the highest rank


## Simple Example
```javascript
SmartCrop.crop(image, {width: 100, height: 100}, function(result){console.log(result);});
// {topCrop: {x: 300, y: 200, height: 200, width: 200}}
```

## Download/ Installation
```npm install smartcrop```
or
```bower install smartcrop```
or just download [smartcrop.js](https://raw.githubusercontent.com/jwagner/smartcrop.js/master/smartcrop.js) from the git repo.

## CLI / Node.js
The [smartcrop-cli](https://github.com/jwagner/smartcrop-cli) offers command line interface to smartcrop.js. It is based on node.js and node-canvas. You can also view it as an example on how to use smartcrop.js from a node.js app.

## Module Formats

Supported:
* common js
* amd
* global export / window

## Supported Browsers
See [caniuse.com/canvas](http://caniuse.com/canvas)

## API

The API is not yet finalized. Look at the code for details and expect changes.

### SmartCrop.crop(image, options, callback)
Crop image using options and call callback(result) when done.

**image:** anything ctx.drawImage() accepts, usually HTMLImageElement, HTMLCanvasElement or HTMLVideoElement. Keep in mind that [origin policies](https://en.wikipedia.org/wiki/Same-origin_policy) apply to the image source, and you may not use cross-domain images without [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing).

**options:** see cropOptions

**callback:** function(cropResult)

### cropOptions

**debug:** if true, cropResults will contain a debugCanvas

**minScale:** minimal scale of the crop rect, set to 1.0 to prevent smaller than necessary crops (lowers the risk of chopping things off).

**width:** width of the crop you want to use. 

**height:** height of the crop you want to use.

There are many more (for now undocumented) options available. Check the [source](smartcrop.js#L32) and know that they might change in the future.

### cropResult
```javascript
{
  topCrop: crop,
  crops: [crop]
}
```
### crop
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

If you just want some rough numbers: It takes **< 100 ms** to find a **square crop** of a **640x427px** picture on an i7.
In other words, it's fine to run it on one image, it's not cool to run it on an entire gallery on page load.

## Contributors

* [Christian Muehlhaeuser](https://github.com/muesli)

## Ports, Alternatives

* [connect-thumbs](https://github.com/inadarei/connect-thumbs) Middleware for connect.js that supports smartcrop.js by [Irakli Nadareishvili](https://github.com/inadarei/connect-thumbs)
* [smartcrop.go](https://github.com/muesli/smartcrop) by [Christian Muehlhaeuser](https://github.com/muesli)
* [smartcrop.py](https://github.com/hhatto/smartcrop.py) by [Hideo Hattori](http://www.hexacosa.net/about/)
* [smartcrop-rails](https://github.com/sadiqmmm/smartcrop-rails) smartcrop wrapped in a ruby gem by [Mohammed Sadiq](https://github.com/sadiqmmm/)

## License
Copyright (c) 2014 Jonas Wanger, licensed under the MIT License (enclosed)
