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

function SmartCrop(options){
   this.options = extend({}, SmartCrop.DEFAULTS, options);
}
SmartCrop.DEFAULTS = {
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
    canvasFactory: null,
    debug: false
};
SmartCrop.crop = function(image, options, callback){
    if(options.aspect){
        options.width = options.aspect;
        options.height = 1;
    }

    // work around images scaled in css by drawing them onto a canvas
    if(image.naturalWidth && (image.naturalWidth != image.width || image.naturalHeight != image.height)){
        var c = new SmartCrop(options).canvas(image.naturalWidth, image.naturalHeight),
            cctx = c.getContext('2d');
        c.width = image.naturalWidth;
        c.height = image.naturalHeight;
        cctx.drawImage(image, 0, 0);
        image = c;
    }

    var scale = 1,
        prescale = 1;
    if(options.width && options.height) {
        scale = min(image.width/options.width, image.height/options.height);
        options.cropWidth = ~~(options.width * scale);
        options.cropHeight = ~~(options.height * scale);
        // img = 100x100, width = 95x95, scale = 100/95, 1/scale > min
        // don't set minscale smaller than 1/scale
        // -> don't pick crops that need upscaling
        options.minScale = min(options.maxScale || SmartCrop.DEFAULTS.maxScale, max(1/scale, (options.minScale||SmartCrop.DEFAULTS.minScale)));
    }
    var smartCrop = new SmartCrop(options);
    if(options.width && options.height) {
        if(options.prescale !== false){
            prescale = 1/scale/options.minScale;
            if(prescale < 1) {
                var prescaledCanvas = smartCrop.canvas(image.width*prescale, image.height*prescale),
                    ctx = prescaledCanvas.getContext('2d');
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, prescaledCanvas.width, prescaledCanvas.height);
                image = prescaledCanvas;
                smartCrop.options.cropWidth = ~~(options.cropWidth*prescale);
                smartCrop.options.cropHeight = ~~(options.cropHeight*prescale);
            }
            else {
                prescale = 1;
            }
        }
    }
    var result = smartCrop.analyse(image);
    for(var i = 0, i_len = result.crops.length; i < i_len; i++) {
        var crop = result.crops[i];
        crop.x = ~~(crop.x/prescale);
        crop.y = ~~(crop.y/prescale);
        crop.width = ~~(crop.width/prescale);
        crop.height = ~~(crop.height/prescale);
    }
    callback(result);
    return result;
};
// check if all the dependencies are there
SmartCrop.isAvailable = function(options){
    try {
        var s = new this(options),
            c = s.canvas(16, 16);
        return typeof c.getContext === 'function';
    }
    catch(e){
        return false;
    }
};
SmartCrop.prototype = {
    canvas: function(w, h){
        if(this.options.canvasFactory !== null){
            return this.options.canvasFactory(w, h);
        }
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    },
    edgeDetect: function(i, o){
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
    },
    skinDetect: function(i, o){
        var id = i.data,
            od = o.data,
            w = i.width,
            h = i.height,
            options = this.options;
        for(var y = 0; y < h; y++) {
            for(var x = 0; x < w; x++) {
                var p = (y*w+x)*4,
                    lightness = cie(id[p], id[p+1], id[p+2])/255,
                    skin = this.skinColor(id[p], id[p+1], id[p+2]);
                if(skin > options.skinThreshold && lightness >= options.skinBrightnessMin && lightness <= options.skinBrightnessMax){
                    od[p] = (skin-options.skinThreshold)*(255/(1-options.skinThreshold));
                }
                else {
                    od[p] = 0;
                }
            }
        }
    },
    saturationDetect: function(i, o){
        var id = i.data,
            od = o.data,
            w = i.width,
            h = i.height,
            options = this.options;
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
    },
    crops: function(image){
        var crops = [],
            width = image.width,
            height = image.height,
            options = this.options,
            minDimension = min(width, height),
            cropWidth = options.cropWidth || minDimension,
            cropHeight = options.cropHeight || minDimension;
        for(var scale = options.maxScale; scale >= options.minScale; scale -= options.scaleStep){
            for(var y = 0; y+cropHeight*scale <= height; y+=options.step) {
                for(var x = 0; x+cropWidth*scale <= width; x+=options.step) {
                    crops.push({
                        x: x,
                        y: y,
                        width: cropWidth*scale,
                        height: cropHeight*scale
                    });
                }
            }
        }
        return crops;
    },
    score: function(output, crop){
        var score = {
                detail: 0,
                saturation: 0,
                skin: 0,
                total: 0
            },
            options = this.options,
            od = output.data,
            downSample = options.scoreDownSample,
            invDownSample = 1/downSample,
            outputHeightDownSample = output.height*downSample,
            outputWidthDownSample = output.width*downSample,
            outputWidth = output.width;
        for(var y = 0; y < outputHeightDownSample; y+=downSample) {
            for(var x = 0; x < outputWidthDownSample; x+=downSample) {
                var p = (~~(y*invDownSample)*outputWidth+~~(x*invDownSample))*4,
                    importance = this.importance(crop, x, y),
                    detail = od[p+1]/255;
                score.skin += od[p]/255*(detail+options.skinBias)*importance;
                score.detail += detail*importance;
                score.saturation += od[p+2]/255*(detail+options.saturationBias)*importance;
            }

        }
        score.total = (score.detail*options.detailWeight + score.skin*options.skinWeight + score.saturation*options.saturationWeight)/crop.width/crop.height;
        return score;
    },
    importance: function(crop, x, y){
        var options = this.options;

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
    },
    skinColor: function(r, g, b){
        var mag = sqrt(r*r+g*g+b*b),
            options = this.options,
            rd = (r/mag-options.skinColor[0]),
            gd = (g/mag-options.skinColor[1]),
            bd = (b/mag-options.skinColor[2]),
            d = sqrt(rd*rd+gd*gd+bd*bd);
            return 1-d;
    },
    analyse: function(image){
        var result = {},
            options = this.options,
            canvas = this.canvas(image.width, image.height),
            ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        var input = ctx.getImageData(0, 0, canvas.width, canvas.height),
            output = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.edgeDetect(input, output);
        this.skinDetect(input, output);
        this.saturationDetect(input, output);

        var scoreCanvas = this.canvas(ceil(image.width/options.scoreDownSample), ceil(image.height/options.scoreDownSample)),
            scoreCtx = scoreCanvas.getContext('2d');

        ctx.putImageData(output, 0, 0);
        scoreCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, scoreCanvas.width, scoreCanvas.height);

        var scoreOutput = scoreCtx.getImageData(0, 0, scoreCanvas.width, scoreCanvas.height);

        var topScore = -Infinity,
            topCrop = null,
            crops = this.crops(image);

        for(var i = 0, i_len = crops.length; i < i_len; i++) {
            var crop = crops[i];
            crop.score = this.score(scoreOutput, crop);
            if(crop.score.total > topScore){
                topCrop = crop;
                topScore = crop.score.total;
            }

        }

        result.crops = crops;
        result.topCrop = topCrop;

        if(options.debug && topCrop){
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(topCrop.x, topCrop.y, topCrop.width, topCrop.height);
            for (var y = 0; y < output.height; y++) {
                for (var x = 0; x < output.width; x++) {
                    var p = (y * output.width + x) * 4;
                    var importance = this.importance(topCrop, x, y);
                    if (importance > 0) {
                        output.data[p + 1] += importance * 32;
                    }

                    if (importance < 0) {
                        output.data[p] += importance * -64;
                    }
                    output.data[p + 3] = 255;
                }
            }
            ctx.putImageData(output, 0, 0);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.strokeRect(topCrop.x, topCrop.y, topCrop.width, topCrop.height);
            result.debugCanvas = canvas;
        }
        return result;
    }
};

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
if (typeof define !== 'undefined' && define.amd) define(function(){return SmartCrop;});
//common js
if (typeof exports !== 'undefined') exports.SmartCrop = SmartCrop;
// browser
else if (typeof navigator !== 'undefined') window.SmartCrop = SmartCrop;
// nodejs
if (typeof module !== 'undefined') {
    module.exports = SmartCrop;
}
})();
