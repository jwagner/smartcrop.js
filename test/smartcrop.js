(function() {
mocha.setup('bdd');
var expect = chai.expect;

var KITTY = '/examples/images/flickr/kitty.jpg';
describe('smartcrop', function() {
  var img;
  beforeEach(function(done) {
    img = new Image();
    img.src = KITTY;
    img.onload = function() {done();};
  });
  function validResult(result) {
    expect(result.topCrop.x).to.be.within(0, img.width - result.topCrop.width);
    expect(result.topCrop.y).to.be.within(0, img.height - result.topCrop.height);
    expect(result.topCrop.width).to.be.within(1, img.width);
    expect(result.topCrop.height).to.be.within(1, img.height);
  }
  describe('isAvailable', function() {
    it('should return true when canvas is available', function() {
      expect(smartcrop.isAvailable()).to.equal(true);
    });
  });
  describe('crop', function() {
    it('should do something sane', function() {
      var c = document.createElement('canvas');
      var ctx = c.getContext('2d');
      c.width = 128;
      c.height = 64;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = 'red';
      ctx.fillRect(96, 32, 16, 16);
      return smartcrop.crop(c, {debug: false}).then(function(result) {
        // document.body.appendChild(c);
        // document.body.appendChild(result.debugCanvas);
        expect(result.topCrop.x).to.be.lessThan(96);
        expect(result.topCrop.y).to.be.lessThan(32);
        expect(result.topCrop.x + result.topCrop.width).to.be.greaterThan(112);
        expect(result.topCrop.y + result.topCrop.height).to.be.greaterThan(48);
      });
    });
    it('should adhere to minScale', function() {
      return smartcrop.crop(img, {minScale: 1}, function(result) {
        validResult(result);
        expect(result.topCrop.y).to.equal(0);
        expect(result.topCrop.height).to.equal(img.height);
      });
    });
    it('should take into account boost', function() {
      var boost = [{x: img.width - 128, y: img.height - 128, width: 64, height: 64, weight: 1.0}];
      console.log(img.width, img.height);
      return smartcrop.crop(img, {boost: boost}, function(result) {
        validResult(result);
        expect(result.topCrop.y).to.equal(0);
        expect(result.topCrop.x).to.equal(208);
        expect(result.topCrop.height).to.equal(img.height);
      });
    });

    it('should crop the kitty', function() {
      return smartcrop.crop(img, {}, function(result) {
        validResult(result);
      });
    });
  });
  describe('iop', function() {
    describe('open', function() {
      it('passes input options', function() {
        var iop = smartcrop._canvasImageOperations(smartcrop.DEFAULTS.canvasFactory);
        var open = iop.open;
        var inputOptions;
        iop.open = function(image, inputOptions_) {
          inputOptions = inputOptions_;
          return open(image);
        };
        var options = {
          imageOperations: iop,
          input: {foo: 'bar'}
        };
        return smartcrop.crop(img, options, function(result) {
          expect(inputOptions).to.equal(options.input);
          validResult(result);
        });
      });
    });
  });

  describe('_integralImage', function() {
    it('creates an integral image', function() {
      const input =  [1,9,2,9,3,9,
                    2,9,3,9,4,9,
                    3,9,4,9,5,9];
      const output = [0,0,0,0,0,0,
                    0,0,0,0,0,0,
                    0,0,0,0,0,0];
      const expected0 = [1,0,3,0,6,0,
                    3,0,8,0,15,0,
                    6,0,15,0,27,0];
      const expected1 = [1,9,3,18,6,27,
                    3,18,8,36,15,54,
                    6,27,15,54,27,81];
      smartcrop._integralImage(input, output, 3, 2, 0);
      expect(output).to.deep.equal(expected0);

      smartcrop._integralImage(input, output, 3, 2, 1);
      console.log(output);
      expect(output).to.deep.equal(expected1);
    });
  });

  describe('_integrateIntegralImage', function() {
    it('integrates the values under the area', function() {
      const image = [1,9,3,18,6,27,
                    3,18,8,36,15,54,
                    6,27,15,54,27,81];
      expect(smartcrop._integrateIntegralImage(image, 3, 2, 0, 1, 1, 2, 2)).to.equal(16);
      expect(smartcrop._integrateIntegralImage(image, 3, 2, 0, 0, 0, 2, 2)).to.equal(27);
      expect(smartcrop._integrateIntegralImage(image, 3, 2, 1, 0, 0, 2, 2)).to.equal(81);
    });
  });

  describe('_downSample', function() {
    var input = {
      width: 4,
      height: 4,
      data: mono2rgba([
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 8, 7, 6,
          5, 4, 3, 2,
      ]),
    };
    function mono2rgba(input) {
      var output = new Uint8Array(input.length * 4);
      for (var i = 0; i < input.length; i++) {
        output[i * 4] = input[i];
        output[i * 4 + 1] = input[i];
        output[i * 4 + 2] = input[i];
        output[i * 4 + 3] = input[i];
      }
      return output;
    }
    it('keeps the image the same at a factor of one', function() {
      var output = smartcrop._downSample(input, 1);
      expect(output.width).to.equal(input.width);
      expect(output.height).to.equal(input.height);
      expect(output.data).to.deep.equal(input.data);
    });

    xit('samples down an image by a factor of two', function() {
      var expectedOutputData = mono2rgba([
          (1 + 2 + 5 + 6) / 4, (3 + 4 + 7 + 8) / 4,
          (9 + 8 + 5 + 4) / 4, (7 + 6 + 3 + 2) / 4,
      ]);
      var output = smartcrop._downSample(input, 2);
      expect(output.width).to.equal(input.width / 2);
      expect(output.height).to.equal(input.height / 2);
      expect(output.data).to.deep.equal(expectedOutputData);
    });
    it('keeps the a constant value constant', function() {
      var w = 59;
      var h = 23;
      var input = {
        width: 59,
        height: 23,
        data: new Uint8ClampedArray(59 * 23 * 4),
      };
      for (var i = 0; i < input.data.length; i++) {
        input.data[i] = 119;
      }
      var output = smartcrop._downSample(input, 8);
      expect(output.width).to.equal(~~(input.width / 8));
      expect(output.height).to.equal(~~(input.height / 8));
      for (i = 0; i < output.data.length; i++) {
        expect(output.data[i]).to.be.within(118, 120);
      }
    });
  });
});
})();
