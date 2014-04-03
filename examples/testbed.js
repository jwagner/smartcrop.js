(function(){
var canvas = $('canvas')[0],
    form = document.forms[0],
    ctx = canvas.getContext('2d'),
    img;
$('html')
    .on('dragover', function(e) {e.preventDefault(); return false;})
    .on('drop', function(e) {
        var files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            if (typeof FileReader !== "undefined" && file.type.indexOf("image") != -1) {
                var reader = new FileReader();
                // Note: addEventListener doesn't work in Google Chrome for this event
                reader.onload = function (evt) {
                    img = new Image();
                    img.onload = function(){
                        analyze();
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        }
        return false;
    });
$('input[type=range]').change(_.debounce(function(){
    $(this).next('.value').text($(this).val());
    analyze();
}));
function analyze(){
    if(!img) return;
    SmartCrop.crop(img, {width: form.width.value, height: form.height.value, debug: true}, draw);
}
function draw(result){
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.strokeRect(result.topCrop.x, result.topCrop.y, result.topCrop.width, result.topCrop.height);
    $('#debug').empty().append(result.debugCanvas);
}

})();
