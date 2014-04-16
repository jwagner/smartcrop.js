(function(){
var KITTY = '/examples/images/flickr/kitty.jpg';
describe("SmartCrop", function() {
    var img;
    beforeEach(function(done){
        img = new Image();
        img.src = KITTY;
        img.onload = function(){done();};
    });
    function validResult(result){
        expect(result.topCrop.x).to.be.within(0, img.width-result.topCrop.width);
        expect(result.topCrop.y).to.be.within(0, img.height-result.topCrop.height);
        expect(result.topCrop.width).to.be.within(1, img.width);
        expect(result.topCrop.height).to.be.within(1, img.height);
    }
    describe("isAvailable", function(){
        it("should return true when canvas is available", function(){
            expect(SmartCrop.isAvailable()).to.equal(true);
        });
        it("should return false when canvas is not available", function(){
            expect(SmartCrop.isAvailable({canvasFactory: function(){}})).to.equal(false);
        });
    });
    describe("crop", function() {
        it("should do something sane", function(done){
            var c = document.createElement('canvas'),
                ctx = c.getContext('2d');
            c.width = 128;
            c.height = 64;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 128, 64);
            ctx.fillStyle = 'red';
            ctx.fillRect(96, 32, 16, 16);
            SmartCrop.crop(c, {debug: false}, function(result){
                //document.body.appendChild(c);
                //document.body.appendChild(result.debugCanvas);
                expect(result.topCrop.x).to.be.lessThan(96);
                expect(result.topCrop.y).to.be.lessThan(32);
                expect(result.topCrop.x+result.topCrop.width).to.be.greaterThan(112);
                expect(result.topCrop.y+result.topCrop.height).to.be.greaterThan(48);
                done();
            });
        });
        it("should adhere to minScale", function(done) {
            SmartCrop.crop(img, {minScale: 1}, function(result){
                validResult(result);
                expect(result.topCrop.y).to.equal(0);
                expect(result.topCrop.height).to.equal(img.height);
                done();
            });
        });
        it("should crop the kitty", function(done) {
            SmartCrop.crop(img, {}, function(result){
                validResult(result);
                done();
            });
        });
    });
});
})();
