module.exports = function(grunt) {
grunt.initConfig({
    connect: {
        options: {
            //useAvailablePort: true,
            port: 8000,
            hostname: '*',
            base: '.',
            //keepalive: true,
            livereload: true
            //debug: true,
        },
        server: {
            options: {
                open: 'http://localhost:8000/examples/testsuite.html'
            }
        },
        test: {
            options: {
                open: 'http://localhost:8000/test/'
            }
        }
    },
    watch: {
        options: {
            livereload: true
        },
        'static': {
            files: ['smartcrop.js', 'examples/*', 'test/*'],
            options: {
                livereload: true
            }
        }
    },
    rsync: {
        options: {
            recursive: true
        },
        release: {
            options: {
                src: 'examples smartcrop.js doc/example.jpg',
                dest: '/var/www/static/sandbox/2014/smartcrop/',
                host: '29a.ch',
                port: '22',
                dryRun: false
            }
        }
    },
    karma: {
        unit: {
            configFile: 'karma.conf.js'
        }
    }
});
grunt.registerTask('default', ['connect:server', 'watch']);
grunt.registerTask('test', ['connect:test', 'watch']);
grunt.registerTask('fetchSamples', 'fetch sample images from 500px api', function(){
    var done = this.async(),
        API500px = require('500px').API500px,
        http = require('http'),
        fs = require('fs'),
        consumerKey = grunt.file.read('.500px-consumer-key').replace(/\n$/, ''),
        api500px = new API500px(consumerKey);
    api500px.photos.searchByTerm('', {rpp: 100, image_size: 4, license_type: 4, sort: 'rating'}, function(error, results){
        var downloaded = 0,
            samples = results.photos.map(function(photo){
                var name = 'images/' + photo.id*1 + '.jpg',
                    f = fs.createWriteStream('examples/' + name);
                http.get(photo.image_url, function(response){
                    response.pipe(f);
                });
                f.on('finish', function(){
                    f.close();
                    if(++downloaded == samples.length){
                        done();
                    }
                });
                return {
                    id: photo.id,
                    name: photo.name,
                    url: name,
                    attribution: photo.user.fullname,
                    thumb: photo.image_url.replace('4.jpg', '2.jpg'),
                    href: 'http://500px.com/photo/' + photo.id
                };
            });
        grunt.file.write('examples/images/images.json', JSON.stringify(samples));
        //console.log(JSON.stringify(consumerKey), error, results);
        //done();
    });

});
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-connect');
grunt.loadNpmTasks('grunt-rsync');
};
