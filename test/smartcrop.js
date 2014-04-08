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
    describe("crop", function() {
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
