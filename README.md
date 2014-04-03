# smartcrop.js

**WARNING: This is a work in progress. Neither the API nor the algorithm are finished.
(Automated) verification, testing and benchmarking are yet to be done.**

Smartcrop.js implements an algorithm to find good crops for images.

![Example](http://29a.ch/sandbox/2014/smartcrop/example.jpg)
Image: [https://www.flickr.com/photos/endogamia/5682480447/](https://www.flickr.com/photos/endogamia/5682480447) by N. Feans

It does this using fairly dumb image processing. In short:

1. Find edges using laplace
1. Find regions with a color like skin
1. Find regions high in saturation
1. Generate a set of candidate crops
1. Rank them using a importance function to focus the detail in the center
  and avoid it in the edges. 
1. Output the candidate crop with the highest rank

## Demos
* [Test Suite](http://29a.ch/sandbox/2014/smartcrop/examples/testsuite.html) containing over 100 images, **heavy**
* [Test Bed](http://29a.ch/sandbox/2014/smartcrop/examples/testbed.html) allows you to upload your own images


## Simple Example
```javascript
var result = SmartCrop.crop(image, {width: 100, height: 100}, function(result){console.log(result);});
// {topCrop: {x: 300, y: 200, height: 200, width: 200}}
```

# CLI / Node.js
The [smartcrop-cli](https://github.com/jwagner/smartcrop-cli) offers command line interface to smartcrop.js. It is based on node.js and node-canvas. You can also view it as an example on how to use smartcrop.js from a node.js app.

## Module Formats

Smartcrop.js can be used as plain javascript in the browser, amd or commonjs module.
It can be in a node environment using node-canvas. There are no dependencies.

## Supported Browsers
See [caniuse.com/canvas](http://caniuse.com/canvas)

## API

The API is not yet finalized. Look at the code and expect changes.
