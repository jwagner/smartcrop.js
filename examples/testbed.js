(function(){
var canvas = $('canvas')[0],
    form = document.forms[0],
    ctx = canvas.getContext('2d'),
    img, crop;
$('html')
    .on('dragover', function(e) {e.preventDefault(); return false;})
    .on('drop', function(e) {
        var files = e.originalEvent.dataTransfer.files;
        handleFiles(files);
        return false;
    });
$('input[type=file]').change(function(e) { handleFiles(this.files); } );

function handleFiles(files){
    if (files.length > 0) {
        var file = files[0];
        if (typeof FileReader !== "undefined" && file.type.indexOf("image") != -1) {
            var reader = new FileReader();
            // Note: addEventListener doesn't work in Google Chrome for this event
            reader.onload = function (evt) {
                load(evt.target.result);
             };
            reader.readAsDataURL(file);
        }
    }
}


load('images/flickr/kitty.jpg');
$('input[type=range]').change(_.debounce(function(){
    $(this).next('.value').text($(this).val());
    analyze();
}));
function load(src){
    img = new Image();
    img.onload = function(){
        analyze();
    };
    img.src = src;

}
function analyze(){
    if(!img) return;
    smartCrop.crop(img, {
        width: form.width.value*1,
        height: form.height.value*1,
        minScale: form.minScale.value*1,
        debug: true
    }, draw);
}
function draw(result){
    selectedCrop = result.topCrop;
    $('.crops').empty().append(_.sortBy(result.crops, function(c){return -c.score.total;}).map(function(crop){
        return $('<p>')
            .text('Score: ' + ~~(crop.score.total*10000000) + ', ' + crop.x+'x'+crop.y)
            .hover(function(){
                drawCrop(crop);
            }, function(){
                drawCrop(selectedCrop);
            })
            .click(function(){ selectedCrop = crop; drawCrop(selectedCrop); })
            .data('crop', crop);
    }));
    drawCrop(selectedCrop);
    $('#debug').empty().append(smartCrop.debugDraw(result));
}
function drawCrop(crop){
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
}

})();
