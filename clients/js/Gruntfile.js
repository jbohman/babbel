/* global module */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    uglify : {
      app : {
        files : {
          'babbel.min.js' : ['node_modules/fast-json-patch/src/json-patch-duplex.js', 'babbel.js']
        }
      }
    },

    jshint : {
      options : {
        'bitwise' : true,
        'boss'    : true,
        'browser' : true,
        'curly'   : true,
        'devel'   : true,
        'eqnull'  : true,
        'globals' : {
            'jsonpatch': false,
             'Babbel': true
        },
        'globalstrict' : true,
        'indent'       : 4,
        'latedef'      : true,
        'maxlen'       : 115,
        'noempty'      : true,
        'nonstandard'  : true,
        'undef'        : true,
        'unused'       : true,
        'trailing'     : true
      },
      all : ['babbel.js']
    },

    watch : {
      scripts : {
        files : 'babbel.js',
        tasks : ['default', 'notify:watch'],
        options : {
          interrupt : true
        }
      }
    },

    notify: {
      watch: {
        options: {
          title: 'Grunt Watch',
          message: 'Build Finished'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');

  grunt.registerTask('build', ['jshint', 'uglify']);

  grunt.registerTask('default', ['build']);
};
