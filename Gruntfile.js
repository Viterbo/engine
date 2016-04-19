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
                separator: ';',
            },
            lib: {
                src: [
                    'src/wrapper_begin.js',
                    'src/treequery.js',
                    'src/filters.js',
                    'src/engine.js',
                    'src/factory.js',
                    'src/strategies/base-strategy.js',
                    'src/strategies/html-element.js',
                    'src/strategies/js-object.js',
                    'src/apis/jquery-api.js',
                    'src/wrapper_end.js'
                ],
                dest: 'dist/treequery.js',
            }
        },
        requirejs: {
            options: { 
                findNestedDependencies: true,
                baseUrl : 'dist', 
                name : 'treequery',                 
                out : 'dist/treequery.min.js'
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