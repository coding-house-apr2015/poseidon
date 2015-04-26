/* jshint camelcase:false */

'use strict';

var run = require('run-sequence');
var rev = require('gulp-rev');
var gulp = require('gulp');
var jade = require('gulp-jade');
var less = require('gulp-less');
var lint = require('gulp-jshint');
var copy = require('gulp-copy');
var util = require('gulp-util');
var size = require('gulp-filesize');
var watch = require('gulp-watch');
var bower = require('gulp-bower');
//var debug = require('gulp-debug');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var rimraf = require('rimraf');
var mincss = require('gulp-minify-css');
var gulpif = require('gulp-if');
var browser = require('browser-sync');
var replace = require('gulp-rev-replace');
var annotate = require('gulp-ng-annotate');
var awspublish = require('gulp-awspublish');
var parallelize = require('concurrent-transform');

var paths = {
  filesrc:  ['./client/**/*'],
  jadesrc:  ['./client/**/*.jade'],
  htmlsrc:  ['./public/**/*.html'],
  lesssrc:  ['./client/index.less'],
  codesrc:  ['./client/**/*.js'],
  mediasrc: ['./client/assets/**/*', './client/favicon.ico'],
  destination: './public',
  temp: './temp',
  tempfiles: ['./temp/*.css', './temp/*.js'],
  manifest: './temp/rev-manifest.json',
  rev: './public/index*s',
  aws: '.awspublish-*'
};

var isProd = process.env.NODE_ENV === 'production';

// --> TASKS ********************************** //

gulp.task('build', ['clean:rev'], function(cb){
  run('jade', 'lint', 'replace', 'copy', cb);
});

gulp.task('refresh', function(cb){
  run('build', 'reload', cb);
});

gulp.task('default', ['clean:public', 'clean:temp'], function(cb){
  run('bower', 'build', 'serve', 'watch', cb);
});

gulp.task('deploy', ['clean:public', 'clean:temp'], function(cb){
  run('bower', 'build', cb);
});

// --> TASKS ********************************** //

gulp.task('clean:public', function(cb){
  rimraf(paths.destination, cb);
});

gulp.task('clean:temp', function(cb){
  rimraf(paths.temp, cb);
});

gulp.task('clean:rev', function(cb){
  rimraf(paths.rev, cb);
});

gulp.task('clean:aws', function(cb){
  rimraf(paths.aws, cb);
});

gulp.task('bower', function() {
  return bower();
});

gulp.task('less', function() {
  return gulp.src(paths.lesssrc)
    .pipe(less())
    .pipe(gulpif(isProd, rename({suffix: '.min'})))
    .pipe(gulpif(isProd, mincss()))
    .pipe(gulp.dest(paths.temp))
    .pipe(size())
    .on('error', util.log);
});

gulp.task('js', function() {
  return gulp.src(paths.codesrc)
    .pipe(concat('index.js'))
    .pipe(annotate({single_quotes: true}))
    .pipe(gulpif(isProd, rename({suffix: '.min'})))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest(paths.temp))
    .pipe(size())
    .on('error', util.log);
});

gulp.task('rev', ['less', 'js'], function() {
  return gulp.src(paths.tempfiles)
    .pipe(rev())
    .pipe(gulp.dest(paths.destination))
    .pipe(rev.manifest())
    .pipe(gulp.dest(paths.temp))
    .on('error', util.log);
});

gulp.task('replace', ['rev'], function() {
  var manifest = gulp.src(paths.manifest);

  return gulp.src(paths.htmlsrc)
    .pipe(replace({manifest: manifest}))
    .pipe(gulp.dest(paths.destination))
    .on('error', util.log);
});

gulp.task('jade', function() {
  return gulp.src(paths.jadesrc)
    .pipe(jade({pretty: true, doctype: 'html', locals: {isProd: isProd}}))
    .pipe(gulp.dest(paths.destination))
    .on('error', util.log);
});

gulp.task('lint', function() {
  return gulp.src(paths.codesrc)
    .pipe(lint())
    .pipe(lint.reporter('jshint-stylish'))
    .on('error', util.log);
});

gulp.task('lint-self', function() {
  return gulp.src('./gulpfile.js')
    .pipe(lint())
    .pipe(lint.reporter('jshint-stylish'))
    .on('error', util.log);
});

gulp.task('copy', function() {
  return gulp.src(paths.mediasrc)
    .pipe(copy(paths.destination, {prefix:1}))
    .on('error', util.log);
});

gulp.task('serve', function() {
  return browser({server: paths.destination});
});

gulp.task('reload', function () {
  return browser.reload();
});

gulp.task('watch', function() {
  return watch(paths.filesrc, function() {
    gulp.start('refresh');
  });
});

// AWS_SECRET_ACCESS_KEY
// AWS_ACCESS_KEY_ID
// AWS_BUCKET

gulp.task('aws:publish', function() {
  var publisher = awspublish.create({bucket: process.env.AWS_BUCKET});
  //var headers = {'Cache-Control': 'max-age=315360000, public'};
  var headers = {};
  return gulp.src('./public/**/*')
    .pipe(awspublish.gzip())
    .pipe(parallelize(publisher.publish(headers), 20))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter());
});

gulp.task('aws:publish:clean', ['clean:public', 'clean:temp', 'clean:aws'], function() {
  var publisher = awspublish.create({bucket: process.env.AWS_BUCKET});
  return gulp.src('./public/**/*')
    .pipe(publisher.sync())
    .pipe(awspublish.reporter());
});

gulp.task('aws:publish:full', ['aws:publish:clean'], function(cb) {
  run('deploy', 'aws:publish', cb);
});
