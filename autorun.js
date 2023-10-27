var fs = require('fs');
var path = require('path');
var yauzl = require('yauzl');
var exec = require('child_process').exec;
var sharp = require('sharp');

// Kiểm tra xem có đủ đối số không
if (process.argv.length < 4) {
  console.log('Usage: node autorun.js <đường_dẫn_đến_thư_mục_ảnh> <size>');
  process.exit(1);
}

// Lấy đường dẫn đến thư mục ảnh từ đối số dòng lệnh
var thu_muc_anh = process.argv[2];
var size = process.argv[3];

// Đường dẫn output
var root_path = path.resolve(__dirname);
var inappropriate_output = 'inappropriate_output';
var inappropriate_output_path = path.join(root_path, inappropriate_output);
var suitable_output = 'suitable_output';
var suitable_output_path = path.join(root_path, suitable_output);

// Kiểm tra xem là folder hay zip
if (thu_muc_anh.toLowerCase().endsWith('.zip') || thu_muc_anh.toLowerCase().endsWith('.rar')) {
  // Giải nén tệp zip vào thư mục mới
  var ten_thu_muc_giai_nen = path.basename(thu_muc_anh, path.extname(thu_muc_anh));
  var duong_dan_thu_muc_giai_nen = path.join(path.dirname(thu_muc_anh), ten_thu_muc_giai_nen);

  // Kiểm tra xem thư mục đích đã tồn tại chưa
  if (!fs.existsSync(duong_dan_thu_muc_giai_nen)) {
    fs.mkdirSync(duong_dan_thu_muc_giai_nen);
  }

  yauzl.open(thu_muc_anh, { lazyEntries: true }, function (err, zipfile) {
    if (err) throw err;

    zipfile.readEntry();
    zipfile.on('entry', function (entry) {
      if (/\/$/.test(entry.fileName)) {
        // Tạo thư mục nếu đường dẫn là thư mục
        fs.mkdirSync(path.join(duong_dan_thu_muc_giai_nen, entry.fileName));
        zipfile.readEntry();
      } else {
        // Giải nén tệp tin vào thư mục
        zipfile.openReadStream(entry, function (err, readStream) {
          if (err) throw err;
          var writeStream = fs.createWriteStream(path.join(duong_dan_thu_muc_giai_nen, entry.fileName));
          readStream.pipe(writeStream);
          readStream.on('end', function () {
            writeStream.end();
            zipfile.readEntry();
          });
        });
      }
    });
  });

  // Sử dụng đường dẫn của thư mục giải nén thay thế cho đường dẫn ban đầu
  thu_muc_anh = duong_dan_thu_muc_giai_nen;
}

// Kiểm tra xem đường dẫn có tồn tại không
if (!fs.existsSync(thu_muc_anh)) {
  console.log('Thư mục ảnh không tồn tại.');
  process.exit(1);
}

// Lấy danh sách các tệp ảnh trong thư mục
var danh_sach_tep_anh = fs.readdirSync(thu_muc_anh).filter(function (tep) {
  return tep.toLowerCase().endsWith('.webp') || tep.toLowerCase().endsWith('.png') || tep.toLowerCase().endsWith('.jpg') || tep.toLowerCase().endsWith('.jpeg') || tep.toLowerCase().endsWith('.gif') || tep.toLowerCase().endsWith('.bmp');
});

console.log(danh_sach_tep_anh);

danh_sach_tep_anh.forEach(function (tep) {
  var duong_dan_tep_anh = path.join(thu_muc_anh, tep);

  // Đoạn mã xử lý cho từng tệp ảnh ở đây
  console.log('Đường dẫn của tệp ảnh:', duong_dan_tep_anh);

  // Sử dụng sharp để lấy kích thước chiều dài và chiều rộng của ảnh
  sharp(duong_dan_tep_anh).metadata().then(function (metadata) {
    var originWidth = metadata.width;
    var originHeight = metadata.height;

    if (originWidth < size && originHeight < size) {
      // Kiểm tra nếu thư mục đích không tồn tại, tạo thư mục đích
      if (!fs.existsSync(path.dirname(inappropriate_output_path))) {
        fs.mkdirSync(path.dirname(inappropriate_output_path), { recursive: true });
      }

      // Sao chép tệp tin từ thư mục gốc đến thư mục đích
      fs.copyFileSync(duong_dan_tep_anh, path.join(inappropriate_output_path,tep));
      console.log('Đã chuyển tệp ảnh đến: ' + inappropriate_output);
      return;
    }

    if (originWidth == size || originHeight == size) {
      fs.copyFileSync(duong_dan_tep_anh, path.join(suitable_output_path,tep));
      return;
    }
    // Xác định chiều dài và chiều rộng mới dựa trên chiều dài lớn nhất
    var newWidth, newHeight;
    if (originWidth > originHeight) {
      newWidth = size;
      newHeight = newWidth * (originHeight / originWidth);
    } else {
      newHeight = size;
      newWidth = newHeight * (originWidth / originHeight);
    }

    var command = 'smartcrop --width ' + newWidth + ' --height ' + newHeight + ' ' + duong_dan_tep_anh + ' suitable_output/' + 'cropped_' + tep;

    // Sử dụng exec như bình thường
    exec(command, function (error, stdout, stderr) {
      if (error) {
        console.error('Lỗi khi thực thi lệnh: ' + error.message + ' ' + stderr);
        return;
      }
      console.log('Kết quả lệnh: ' + stdout);
    });
  }).catch(function (error) {
    console.error('Lỗi khi đọc kích thước ảnh: ' + error.message);
  });
});


