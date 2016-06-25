module.exports = function(grunt) {
  grunt.initConfig({
    connect: {
      options: {
        // useAvailablePort: true,
        port: 8000,
        hostname: '*',
        base: '.',
        // keepalive: true,
        livereload: true,
        // debug: true,
      },
      server: {
        options: {
          open: 'http://localhost:8000/examples/testsuite.html',
        },
      },
      test: {
        options: {
          open: 'http://localhost:8000/test/',
        },
      },
    },
    watch: {
      options: {
        livereload: true,
      },
      static: {
        files: ['smartcrop.js', 'examples/*', 'test/*'],
        options: {
          livereload: true,
        },
      },
    },
    rsync: {
      options: {
        recursive: true,
      },
      release: {
        options: {
          src: 'examples smartcrop.js doc/example.jpg',
          dest: '/var/www/static/sandbox/2014/smartcrop/',
          host: '29a.ch',
          port: '22',
          dryRun: false,
        },
      },
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
      },
    },
  });
  grunt.registerTask('default', ['connect:server', 'watch']);
  grunt.registerTask('test', ['connect:test', 'watch']);
  grunt.registerTask('fetchSamples', 'fetch sample images from 500px api', function() {
    var done = this.async();
    var API500px = require('500px').API500px;
    var http = require('http');
    var fs = require('fs');
    var consumerKey = grunt.file.read('.500px-consumer-key').replace(/\n$/, '');
    var api500px = new API500px(consumerKey);
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    var oprions = {rpp: 100, image_size: 4, license_type: 4, sort: 'rating'};

    api500px.photos.searchByTerm('', options, function(error, results) {
      var downloaded = 0;
      var samples = results.photos.map(function(photo) {
              var name = 'images/' + photo.id * 1 + '.jpg';
              var f = fs.createWriteStream('examples/' + name);
              http.get(photo.image_url, function(response) {
                response.pipe(f);
              });
              f.on('finish', function() {
                f.close();
                if (++downloaded == samples.length) {
                  done();
                }
              });
              return {
                id: photo.id,
                name: photo.name,
                url: name,
                attribution: photo.user.fullname,
                thumb: photo.image_url.replace('4.jpg', '2.jpg'),
                href: 'http://500px.com/photo/' + photo.id,
              };
            });
      grunt.file.write('examples/images/images.json', JSON.stringify(samples));
      // jscs:enable
    });

  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-rsync');
};
