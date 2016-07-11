# smartcrop.js

[![Build Status](https://travis-ci.org/jwagner/smartcrop.js.svg?branch=travis)](https://travis-ci.org/jwagner/smartcrop.js)

Smartcrop.js implements an algorithm to find good crops for images.
It can be used in the browser, in node or via a CLI.

![Example](http://29a.ch/sandbox/2014/smartcrop/example.jpg)
Image: [https://www.flickr.com/photos/endogamia/5682480447/](https://www.flickr.com/photos/endogamia/5682480447) by N. Feans

## Demos
* [Test Suite](http://29a.ch/sandbox/2014/smartcrop/examples/testsuite.html), contains over 100 images, **heavy**.
* [Test Bed](http://29a.ch/sandbox/2014/smartcrop/examples/testbed.html), allows you to test smartcrop with your own images and different face detection libraries.
* [Photo transitions](http://29a.ch/sandbox/2014/smartcrop/examples/slideshow.html), automatically creates Ken Burns transitions for a slide show.

## Algorithm Overview
Smartcrop.js works using fairly dumb image processing. In short:

1. Find edges using laplace
1. Find regions with a color like skin
1. Find regions high in saturation
1. Boost regions as specified by options (for example detected faces)
1. Generate a set of candidate crops using a sliding window
1. Rank them using an importance function to focus the detail in the center
  and avoid it in the edges.
1. Output the candidate crop with the highest rank


## Simple Example
```javascript
smartcrop.crop(image, {width: 100, height: 100}).then(function(result){
  console.log(result);
});
```
Output:
```javascript
{topCrop: {x: 300, y: 200, height: 200, width: 200}}
```

## Download/ Installation
```npm install smartcrop```
or
```bower install smartcrop```
or just download [smartcrop.js](https://raw.githubusercontent.com/jwagner/smartcrop.js/master/smartcrop.js) from the git repository.

Smarcrop requires support for [Promises](http://caniuse.com/#feat=promises),
use a [polyfill](https://github.com/taylorhakes/promise-polyfill) for unsupported browsers or set `smartcrop.Promise` to your favorite promise implementation
(I recommend [bluebird](http://bluebirdjs.com/)).

## Command Line Interface
The [smartcrop-cli](https://github.com/jwagner/smartcrop-cli) offers command line interface to smartcrop.js.

## Node
You can use smartcrop from nodejs via either [smartcrop-gm](https://github.com/jwagner/smartcrop-gm) (which is using image magick via gm) or [smartcrop-sharp](https://github.com/jwagner/smartcrop-sharp) (which is using libvips via sharp).
The [smartcrop-cli](https://github.com/jwagner/smartcrop-cli) can be used as an example of using smartcrop from node.

## Supported Module Formats

* CommonJS
* AMD
* global export / window

## Supported Browsers

See [caniuse.com/canvas](http://caniuse.com/canvas).
A [polyfill](https://github.com/taylorhakes/promise-polyfill) for
[Promises](http://caniuse.com/#feat=promises) is recommended.

## API

The API is not yet finalized, expect changes.

### smartcrop.crop(image, options)
Find the best crop for *image* using *options*.

**image:** anything ctx.drawImage() accepts, usually HTMLImageElement, HTMLCanvasElement or HTMLVideoElement.

Keep in mind that [origin policies](https://en.wikipedia.org/wiki/Same-origin_policy) apply to the image source.
You may not use cross-domain images without [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) clearance.

**options:** [cropOptions](#cropOptions)

**returns:** A promise for a [cropResult](#cropResult).

### cropOptions

**minScale:** minimal scale of the crop rect, set to 1.0 to prevent smaller than necessary crops (lowers the risk of chopping things off).

**width:** width of the crop you want to use.

**height:** height of the crop you want to use.

**boost:** optional array of regions whose 'interestingness' you want to boost (for example faces). See [boost](#boost);

**ruleOfThirds:** optional boolean if set to false it will turn off the rule of thirds composition weight.

**debug *(internal)*:** if true, cropResults will contain a debugCanvas and the complete results array.

There are many more (for now undocumented) options available.
Check the [source](smartcrop.js#L32) and be advised that they might change in the future.

### cropResult
Result of the promise returned by smartcrop.crop.
```javascript
{
  topCrop: crop
}
```

### crop
An invididual crop.

```javascript
{
  x: 11, // pixels from the left side
  y: 20, // pixels from the top
  width: 1, // pixels
  height: 1 // pixels
}
```

### boost
Describes a region to boost. A usage example of this is to take
into account faces in the image. See [smartcrop-cli](https://github.com/jwagner/smartcrop-cli) for an example on how to integrate face detection.

```javascript
{
  x: 11, // pixels from the left side
  y: 20, // pixels from the top
  width: 1, // pixels
  height: 1, // pixels
  weight: 1 // [0, 1]
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

## Version history

### 1.1
Creating github releases. Added options.input which is getting passed along to iop.open.

### 1.0
Refactoring/cleanup to make it easier to use with node.js (dropping the node-canvas dependency) and enable support for boosts which can be used to do face detection.
This is a 1.0 in the semantic meaning (denoting backwards incompatible API changes).
It does not denote a finished product.

## License
Copyright (c) 2016 Jonas Wagner, licensed under the MIT License (enclosed)
