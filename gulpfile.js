'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var minimist = require('minimist');


var knownOptions = {
  string: 'env',
  default: {
    env: process.env.NODE_ENV || 'production'
  }
};

var options = minimist(process.argv.slice(2), knownOptions);

// Copy All Files At The Root Level (app)
gulp.task('copy', function () {
  var app = gulp.src([
    '*.html',
  ], {
    dot: true
  }).pipe(gulp.dest('dist/elements'));

  var bower = gulp.src([
    'bower_components/**/*'
  ]).pipe(gulp.dest('dist'));

  var vulcanized = gulp.src(['cloudstitch-box.html'])
    .pipe($.rename('cloudstitch-box.vulcanized.html'))
    .pipe(gulp.dest('dist/elements'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Vulcanize imports
gulp.task('vulcanize', function () {
  var DEST_DIR = '.';
  return gulp.src('dist/elements/cloudstitch-box.vulcanized.html')
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true,
    }))
    .pipe(gulp.dest('dist/elements'))
    .pipe($.size({title: 'vulcanize'}));
});

gulp.task('deploy:remote', function() {
  var location = 'current';
  if (options.version) {
    location = options.version;
  }
  var s3 = require('gulp-s3-upload')({
    region: 'us-west-2'
  });
  return gulp.src(
        // [
        //     'dist/elements/*vulcanized*'
        // ],
        // {
        //     base: 'dist/elements'
        // }
        ['README.md'],{}
  )
  .pipe(s3({
      Bucket: 'components.cloudstitch.com', //  Required
      ACL:    'public-read',
      keyTransform: function(relative_filename) {
        var fname = 'elements/' + location + '/cloudstitch-box/' + relative_filename;
        console.log(fname);
        return fname;
      }
  }));
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence(
    'copy',
    'vulcanize',
    cb);
    // Note: add , 'precache' , after 'vulcanize', if your are going to use Service Worker
});
