/** smart-crop.js
 * A javascript library implementing content aware image cropping
 *
 * Copyright (C) 2014 Jonas Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function(){
"use strict";



var smartcrop = {};
// promise implementation to use
smartcrop.Promise = typeof Promise !== 'undefined' ? Promise : function(){
    throw new Error('No native promises and smartcrop.promise not set.');
};

smartcrop.DEFAULTS = {
    width: 0,
    height: 0,
    aspect: 0,
    cropWidth: 0,
    cropHeight: 0,
    detailWeight: 0.2,
    skinColor: [0.78, 0.57, 0.44],
    skinBias: 0.01,
    skinBrightnessMin: 0.2,
    skinBrightnessMax: 1.0,
    skinThreshold: 0.8,
    skinWeight: 1.8,
    saturationBrightnessMin: 0.05,
    saturationBrightnessMax: 0.9,
    saturationThreshold: 0.4,
    saturationBias: 0.2,
    saturationWeight: 0.3,
    // step * minscale rounded down to the next power of two should be good
    scoreDownSample: 8,
    step: 8,
    scaleStep: 0.1,
    minScale: 0.9,
    maxScale: 1.0,
    edgeRadius: 0.4,
    edgeWeight: -20.0,
    outsideImportance: -0.5,
    ruleOfThirds: true,
    prescale: true,
    imageOperations: null,
    canvasFactory: defaultCanvasFactory,
    //factory: defaultFactories,
    debug: false
};



smartcrop.crop = function(inputImage, options_, callback){
   var options = extend({}, smartcrop.DEFAULTS, options_);
    if(options.aspect){
        options.width = options.aspect;
        options.height = 1;
    }
    if(options.imageOperations === null) {
        options.imageOperations = canvasImageOperations(options.canvasFactory);
    }

    var iop = options.imageOperations;
    return iop.open(inputImage).then(function(image){
        var scale = 1,
            prescale = 1;
        if(options.width && options.height) {
            scale = min(image.width/options.width, image.height/options.height);
            options.cropWidth = ~~(options.width * scale);
            options.cropHeight = ~~(options.height * scale);
            // img = 100x100, width = 95x95, scale = 100/95, 1/scale > min
            // don't set minscale smaller than 1/scale
            // -> don't pick crops that need upscaling
            options.minScale = min(options.maxScale, max(1/scale, options.minScale));
        }
        if(options.width && options.height) {
            if(options.prescale !== false){
                prescale = 1/scale/options.minScale;
                if(prescale < 1) {
                    image = iop.resample(image, image.width*prescale, image.height*prescale);
                    options.cropWidth = ~~(options.cropWidth*prescale);
                    options.cropHeight = ~~(options.cropHeight*prescale);
                }
                else {
                    prescale = 1;
                }
            }
        }

        return iop.getData(image).then(function(data){
            var result = analyse(options, data);
            for(var i = 0, i_len = result.crops.length; i < i_len; i++) {
                var crop = result.crops[i];
                crop.x = ~~(crop.x/prescale);
                crop.y = ~~(crop.y/prescale);
                crop.width = ~~(crop.width/prescale);
                crop.height = ~~(crop.height/prescale);
            }
            if(callback) callback(result);
            return result;
        });

    });
};


// check if all the dependencies are there
// todo:
smartcrop.isAvailable = function(options){
    if(!smartcrop.Promise) return false;
    var canvasFactory = options ? options.canvasFactory : defaultCanvasFactory;
    if(canvasFactory === defaultCanvasFactory){
        var c = document.createElement('canvas');
        if(!c.getContext('2d')){
            return false;
        }
    }
    return true;
};

function edgeDetect(i, o){
    var id = i.data,
        od = o.data,
        w = i.width,
        h = i.height;
    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            var p = (y*w+x)*4,
                lightness;
            if(x === 0 || x >= w-1 || y === 0 || y >= h-1){
                lightness = sample(id, p);
            }
            else {
                lightness = sample(id, p)*4 - sample(id, p-w*4) - sample(id, p-4) - sample(id, p+4) - sample(id, p+w*4);
            }
            od[p+1] = lightness;
        }
    }
}

function skinDetect(options, i, o){
    var id = i.data,
        od = o.data,
        w = i.width,
        h = i.height;
    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            var p = (y*w+x)*4,
                lightness = cie(id[p], id[p+1], id[p+2])/255,
                skin = skinColor(options, id[p], id[p+1], id[p+2]);
            if(skin > options.skinThreshold && lightness >= options.skinBrightnessMin && lightness <= options.skinBrightnessMax){
                od[p] = (skin-options.skinThreshold)*(255/(1-options.skinThreshold));
            }
            else {
                od[p] = 0;
            }
        }
    }
}

function saturationDetect(options, i, o){
    var id = i.data,
        od = o.data,
        w = i.width,
        h = i.height;
    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            var p = (y*w+x)*4,
                lightness = cie(id[p], id[p+1], id[p+2])/255,
                sat = saturation(id[p], id[p+1], id[p+2]);
            if(sat > options.saturationThreshold && lightness >= options.saturationBrightnessMin && lightness <= options.saturationBrightnessMax){
                od[p+2] = (sat-options.saturationThreshold)*(255/(1-options.saturationThreshold));
            }
            else {
                od[p+2] = 0;
            }
        }
    }
}

function generateCrops(options, width, height){
    var results = [],
        minDimension = min(width, height),
        cropWidth = options.cropWidth || minDimension,
        cropHeight = options.cropHeight || minDimension;
    for(var scale = options.maxScale; scale >= options.minScale; scale -= options.scaleStep){
        for(var y = 0; y+cropHeight*scale <= height; y+=options.step) {
            for(var x = 0; x+cropWidth*scale <= width; x+=options.step) {
                results.push({
                    x: x,
                    y: y,
                    width: cropWidth*scale,
                    height: cropHeight*scale
                });
            }
        }
    }
    return results;
}

function score(options, output, crop){
    var result = {
            detail: 0,
            saturation: 0,
            skin: 0,
            total: 0
        },
        od = output.data,
        downSample = options.scoreDownSample,
        invDownSample = 1/downSample,
        outputHeightDownSample = output.height*downSample,
        outputWidthDownSample = output.width*downSample,
        outputWidth = output.width;

    for(var y = 0; y < outputHeightDownSample; y+=downSample) {
        for(var x = 0; x < outputWidthDownSample; x+=downSample) {
            var p = (~~(y*invDownSample)*outputWidth+~~(x*invDownSample))*4,
                i = importance(options, crop, x, y),
                detail = od[p+1]/255;
            result.skin += od[p]/255*(detail+options.skinBias)*i;
            result.detail += detail*i;
            result.saturation += od[p+2]/255*(detail+options.saturationBias)*i;
        }

    }

    result.total = (result.detail*options.detailWeight + result.skin*options.skinWeight + result.saturation*options.saturationWeight)/crop.width/crop.height;
    return result;
}

function importance(options, crop, x, y){
    if (crop.x > x || x >= crop.x+crop.width || crop.y > y || y >= crop.y+crop.height) return options.outsideImportance;
    x = (x-crop.x)/crop.width;
    y = (y-crop.y)/crop.height;
    var px = abs(0.5-x)*2,
        py = abs(0.5-y)*2,
        // distance from edge
        dx = Math.max(px-1.0+options.edgeRadius, 0),
        dy = Math.max(py-1.0+options.edgeRadius, 0),
        d = (dx*dx+dy*dy)*options.edgeWeight;
    var s = 1.41-sqrt(px*px+py*py);
    if(options.ruleOfThirds){
        s += (Math.max(0, s+d+0.5)*1.2)*(thirds(px)+thirds(py));
    }
    return s+d;
}

function skinColor(options, r, g, b){
    var mag = sqrt(r*r+g*g+b*b),
        rd = (r/mag-options.skinColor[0]),
        gd = (g/mag-options.skinColor[1]),
        bd = (b/mag-options.skinColor[2]),
        d = sqrt(rd*rd+gd*gd+bd*bd);
        return 1-d;
}

function analyse(options, input){
    var result = {};
    var output = new ImgData(input.width, input.height);
    edgeDetect(input, output);
    skinDetect(options, input, output);
    saturationDetect(options, input, output);

    var scoreOutput = downSample(output, options.scoreDownSample);

    var topScore = -Infinity,
        topCrop = null,
        crops = generateCrops(options, input.width, input.height);

    for(var i = 0, i_len = crops.length; i < i_len; i++) {
        var crop = crops[i];
        crop.score = score(options, scoreOutput, crop);
        if(crop.score.total > topScore){
            topCrop = crop;
            topScore = crop.score.total;
        }

    }

    result.crops = crops;
    result.topCrop = topCrop;

    if(options.debug && topCrop){
        result.debugOutput = output;
        result.debugOptions = options;
        // create a copy which will not be adjusted by the post scaling of smartcrop.crop
        result.debugTopCrop = extend({}, result.topCrop);
    }
    return result;
}

function debugDraw(result, showCrop){
    var topCrop = result.debugTopCrop;
    var options = result.debugOptions;
    var output = result.debugOutput;
    var canvas = options.canvasFactory(output.width, output.height);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(topCrop.x, topCrop.y, topCrop.width, topCrop.height);
    var debugOutput = ctx.createImageData(output.width, output.height);
    debugOutput.data.set(output.data);
    for (var y = 0; y < output.height; y++) {
        for (var x = 0; x < output.width; x++) {
            var p = (y * output.width + x) * 4;
            if(showCrop){
                var I = importance(options, topCrop, x, y);
                if (I > 0) {
                    debugOutput.data[p + 1] += I * 32;
                }

                if (I < 0) {
                    debugOutput.data[p] += I * -64;
                }
            }
            debugOutput.data[p + 3] = 255;
        }
    }


    ctx.putImageData(debugOutput, 0, 0);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    if(showCrop){
        ctx.strokeRect(topCrop.x, topCrop.y, topCrop.width, topCrop.height);
    }
    return canvas;
}
smartcrop.debugDraw = debugDraw;

function ImgData(width, height, data){
    this.width = width;
    this.height = height;
    if(data){
        this.data = new Uint8ClampedArray(data);
    }
    else {
        this.data = new Uint8ClampedArray(width*height*4);
    }
}

function downSampleCanvas(input, factor){
    var c = document.createElement('canvas');
    c.width = input.width;
    c.height = input.height;
    var ctx = c.getContext('2d');
    var id = ctx.createImageData(c.width, c.height);
    id.data.set(input.data);
    for(var i = 0; i < id.data.length; i+=4) {
        id.data[i+3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    var w = Math.ceil(input.width/factor);
    var h = Math.ceil(input.height/factor);
    ctx.drawImage(c, 0, 0, input.width, input.height, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
}

function downSample(input, factor){
    var idata = input.data;
    var iwidth = input.width;
    var width = Math.floor(input.width/factor);
    var height = Math.floor(input.height/factor);
    var output = new ImgData(width, height);
    var data = output.data;
    var ifactor2 = 1/(factor*factor);
    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
            var i = (y*width+x)*4;
            var r = 0, g = 0, b = 0, a = 0;
            var mr = 0, mg = 0, mb = 0;
            for(var v = 0; v < factor; v++) {
                for(var u = 0; u < factor; u++) {
                    var j = ((y*factor+v)*iwidth+(x*factor+u))*4;
                    r += idata[j];
                    g += idata[j+1];
                    b += idata[j+2];
                    a += idata[j+3];
                    mr = Math.max(mr, idata[j]);
                    mg = Math.max(mg, idata[j+1]);
                    mb = Math.max(mb, idata[j+2]);
                }
            }
            data[i] = r*ifactor2*0.5+mr*0.5;
            data[i+1] = g*ifactor2*0.7+mg*0.3;
            data[i+2] = b*ifactor2;
            data[i+3] = a*ifactor2;
        }
    }
    return output;
}
smartcrop._downSample = downSample;

function defaultCanvasFactory(w, h){
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

function canvasImageOperations(canvasFactory) {
    return {
        // takes imageInput as argument
        // returns an object which has at least
        // {width: n, height: n}
        open: function(image) {
            // work around images scaled in css by drawing them onto a canvas
            var w = image.naturalWidth || image.width;
            var h = image.naturalHeight || image.height;
            var c = canvasFactory(w, h);
            var ctx = c.getContext('2d');
            if(image.naturalWidth && (image.naturalWidth != image.width || image.naturalHeight != image.height)){
                c.width = image.naturalWidth;
                c.height = image.naturalHeight;
            }
            else {
                c.width = image.width;
                c.height = image.height;
            }
            ctx.drawImage(image, 0, 0);
            return smartcrop.Promise.resolve(c);
        },
        // takes an image (as returned by open), and changes it's size by resampling
        resample: function(image, width, height) {
            return Promise.resolve(image).then(function(image){
                var c = canvasFactory(~~width, ~~height),
                    ctx = c.getContext('2d');

                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, c.width, c.height);
                return smartcrop.Promise.resolve(c);
            });
        },
        getData: function(image) {
            return Promise.resolve(image).then(function(c){
                var ctx = c.getContext('2d');
                var id = ctx.getImageData(0, 0, c.width, c.height);
                return new ImgData(c.width, c.height, id.data);
            });
        }
    };
}

// aliases and helpers
var min = Math.min,
    max = Math.max,
    abs = Math.abs,
    ceil = Math.ceil,
    sqrt = Math.sqrt;

function extend(o){
    for(var i = 1, i_len = arguments.length; i < i_len; i++) {
        var arg = arguments[i];
        if(arg){
            for(var name in arg){
                o[name] = arg[name];
            }
        }
    }
    return o;
}

// gets value in the range of [0, 1] where 0 is the center of the pictures
// returns weight of rule of thirds [0, 1]
function thirds(x){
    x = ((x-(1/3)+1.0)%2.0*0.5-0.5)*16;
    return Math.max(1.0-x*x, 0.0);
}

function cie(r, g, b){
    return 0.5126*b + 0.7152*g + 0.0722*r;
}
function sample(id, p) {
    return cie(id[p], id[p+1], id[p+2]);
}
function saturation(r, g, b){
    var maximum = max(r/255, g/255, b/255), minumum = min(r/255, g/255, b/255);
    if(maximum === minumum){
        return 0;
    }
    var l = (maximum + minumum) / 2,
        d = maximum-minumum;
    return l > 0.5 ? d/(2-maximum-minumum) : d/(maximum+minumum);
}

// amd
if (typeof define !== 'undefined' && define.amd) define(function(){return smartcrop;});
//common js
if (typeof exports !== 'undefined') exports.smartcrop = smartcrop;
// browser
else if (typeof navigator !== 'undefined') window.SmartCrop = window.smartcrop = smartcrop;
// nodejs
if (typeof module !== 'undefined') {
    module.exports = smartcrop;
}
})();
