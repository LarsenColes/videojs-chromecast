/*
 * Copyright (c) 2017 Jeremy Thomerson
 * Licensed under the MIT license.
 */
'use strict';

var path = require('path'),
    getCodeVersion = require('silvermine-serverless-utils/src/get-code-version'),
    join = path.join.bind(path),
    sass = require('sass');

module.exports = function(grunt) {

   var DEBUG = !!grunt.option('debug'),
       config;

   config = {
      js: {
         all: [ 'Gruntfile.js', 'src/**/*.js', 'tests/**/*.js' ],
         browserMainFile: join('src', 'js', 'standalone.js'),
      },

      sass: {
         all: [ '**/*.scss', '!**/node_modules/**/*' ],
         main: join('src', 'scss', 'videojs-chromecast.scss'),
      },

      images: {
         base: join('src', 'images'),
      },

      dist: {
         base: join(__dirname, 'dist'),
      },
   };

   config.dist.js = {
      bundle: join(config.dist.base, 'silvermine-videojs-chromecast.js'),
      minified: join(config.dist.base, 'silvermine-videojs-chromecast.min.js'),
   };

   config.dist.css = {
      base: config.dist.base,
      main: join(config.dist.base, 'silvermine-videojs-chromecast.css'),
   };

   config.dist.images = join(config.dist.base, 'images');

   grunt.initConfig({

      pkg: grunt.file.readJSON('package.json'),
      versionInfo: getCodeVersion.both(),
      config: config,

      clean: {
         build: [ config.dist.base ],
      },

      copy: {
         images: {
            files: [
               {
                  expand: true,
                  cwd: config.images.base,
                  src: '**/*',
                  dest: config.dist.images,
               },
            ],
         },
      },

      browserify: {
         main: {
            src: config.js.browserMainFile,
            dest: config.dist.js.bundle,
            options: {
               transform: [
                  [
                     'babelify',
                     {
                        presets: [
                           [
                              '@babel/preset-env',
                              {
                                 debug: DEBUG,
                                 useBuiltIns: 'usage',
                                 shippedProposals: true,
                                 corejs: 3,
                              },
                           ],
                        ],
                     },
                  ],
               ],
            },
         },
      },

      uglify: {
         main: {
            files: {
               '<%= config.dist.js.minified %>': config.dist.js.bundle,
            },
            options: {
               banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> <%= versionInfo %> */\n',
               sourceMap: DEBUG,
               sourceMapIncludeSources: DEBUG,
               mangle: !DEBUG,
               // Disable the `merge_vars` option in the compression phase.
               // `merge_vars` aggressively reuses variable names, which can lead to
               // unexpected behavior or runtime errors in certain cases.
               compress: DEBUG ? false : { merge_vars: false }, // eslint-disable-line camelcase
               beautify: DEBUG,
            },
         },
      },

      sass: {
         main: {
            files: [
               {
                  src: config.sass.main,
                  dest: config.dist.css.main,
                  ext: '.css',
                  extDot: 'first',
               },
            ],
         },
         options: {
            implementation: sass,
            sourceMap: DEBUG,
            indentWidth: 3,
            outputStyle: DEBUG ? 'expanded' : 'compressed',
            sourceComments: DEBUG,
         },
      },

      postcss: {
         options: {
            map: DEBUG,
            processors: [
               require('autoprefixer')(), // eslint-disable-line global-require
            ],
         },
         styles: {
            src: config.dist.css.main,
         },
      },

      watch: {
         grunt: {
            files: [ 'Gruntfile.js' ],
            tasks: [ 'build' ],
         },

         js: {
            files: [ 'src/**/*.js' ],
            tasks: [ 'build-js' ],
         },

         css: {
            files: [ 'src/**/*.scss' ],
            tasks: [ 'build-css' ],
         },
      },

   });

   grunt.loadNpmTasks('grunt-contrib-clean');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-browserify');
   grunt.loadNpmTasks('grunt-contrib-copy');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-sass');
   grunt.loadNpmTasks('grunt-postcss');

   grunt.registerTask('build-js', [ 'browserify', 'uglify' ]);
   grunt.registerTask('build-css', [ 'sass', 'postcss:styles' ]);
   grunt.registerTask('build', [ 'build-js', 'build-css', 'copy:images' ]);
   grunt.registerTask('develop', function() {
      // Set debug flag globally
      grunt.option('debug', true);
      // Run the tasks
      grunt.task.run([ 'build', 'watch' ]);
   });
   grunt.registerTask('default', [ 'build' ]);

};
