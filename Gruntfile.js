module.exports = function(grunt) {

    var date = grunt.template.today('yyyy-mm-dd');
    var sourceBanner = '/* \n'                                                                             +
        '* !<%= pkg.name %> v<%= pkg.version %> built the: '+ date +'  | Ooyala Pulse HTML5 plugin for Brightcove\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> by Ooyala, www.ooyala.com \n'  +
        '* email: info@ooyala.com \n'                                                       +
        '*/ \n';

    // Load the plugin tasks we need
    [
        "grunt-contrib-uglify",
        "grunt-contrib-clean",
        "grunt-contrib-copy",
        "grunt-contrib-concat",
    ].forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            src: ['dist/']
        },
        concat: {
            pulse: {
                options: {
                    process: function(source, filepath) {
                        console.log(filepath);
                        if (filepath.indexOf('brightcove.pulse.js') > -1) {
                            return source.replace('@VERSION', grunt.template.process('<%= pkg.version %>'));
                        }

                        return source;
                    },
                    banner: sourceBanner
                },
                src: 'src/*.js',
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        //Minify
        uglify: {
            bridge: {
                options: {
                    //banner: sourceBanner,
                    mangle: {
                        except: ['error', 'format', 'request', 'model', 'parse', 'core', 'window', 'document', 'console']
                    }
                },
                files: {
                    'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/<%= pkg.name %>-<%= pkg.version %>.js' ]
                }
            },
        },
    });

    grunt.registerTask('default', [ 'clean', 'concat', 'uglify',]);
};
