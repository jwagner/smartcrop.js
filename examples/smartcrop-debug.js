function debugDraw(result, showCrop) {
  var topCrop = result.debugTopCrop;
  var options = result.debugOptions;
  var output = result.debugOutput;
  var canvas = document.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
  ctx.fillRect(topCrop.x, topCrop.y, topCrop.width, topCrop.height);
  var debugOutput = ctx.createImageData(output.width, output.height);
  debugOutput.data.set(output.data);
  for (var y = 0; y < output.height; y++) {
    for (var x = 0; x < output.width; x++) {
      var p = (y * output.width + x) * 4;
      if (showCrop) {
        var I = smartcrop.importance(options, topCrop, x, y);
        if (I > 0) {
          debugOutput.data[p + 1] += I * 32;
        }

        if (I < 0) {
          debugOutput.data[p] += I * -64;
        }
      }
      // visualize alpha (boost) as magenta
      var boost = debugOutput.data[p + 3] / 2;
      debugOutput.data[p] += boost;
      debugOutput.data[p + 2] += boost;
      debugOutput.data[p + 3] = 255;
    }
  }

  ctx.putImageData(debugOutput, 0, 0);
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  if (showCrop) {
    ctx.strokeRect(topCrop.x, topCrop.y, topCrop.width, topCrop.height);
  }
  if (options.boost) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    for (var i = 0; i < options.boost.length; i++) {
      var b = options.boost[i];
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
  }
  return canvas;
}
