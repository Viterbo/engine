/*
npm install -g grunt-cli
npm init
npm install grunt grunt-contrib-concat grunt-contrib-requirejs grunt-contrib-uglify grunt-contrib-watch --save-dev
*/


module.exports = function(grunt) {
  
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),    
        concat: {
            options: {
                separator: ';\n//------------------------------------------------------\n\n\n',
            },
            lib: {
                src: [
                    'src/wrapper_begin.js',
                    'src/lightsaber.js',
                    'src/display_object.js',
                    'src/dom_wrapper.js',
                    'src/utils.js',                    
                    'src/engine.js',
                    'src/youtube_video.js',
                    'src/sprite.js',
                    'src/scene.js',
                    'src/bitmap_data.js',
                    'src/wrapper_end.js'
                ],
                dest: 'dist/lightsaber.js',
            }
        },
        requirejs: {
            options: { 
                findNestedDependencies: true,
                baseUrl : 'dist', 
                name : 'lightsaber',                 
                out : 'dist/lightsaber.min.js'
            },
            lib: {
                
            }
        },
        watch: {
            files: ["./src/**/*.js", "./src/*.js"],
            tasks: ["default"]
        }

    });    
    
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    
    grunt.registerTask('default', [
        "concat:lib",
        "requirejs:lib"
    ]);
    
    
};