module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    simplemocha: {
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        grep: '*-test',
        ui: 'bdd',
        reporter: 'tap'
      },
      all: { src: ['test/**/*.js'] }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-simple-mocha');

  // Default task(s). (optional defaults)
  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('default', 'simplemocha');
};
