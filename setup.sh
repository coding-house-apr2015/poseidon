#!/bin/bash

# delete temporary files
rm -rf node_modules public temp .awspublish-*

# installing npm development dependencies
npm install bower gulp gulp-copy gulp-jade gulp-less gulp-watch gulp-uglify gulp-concat gulp-rename gulp-util gulp-filesize gulp-minify-css gulp-bower browser-sync gulp-rev gulp-rev-replace gulp-if gulp-debug gulp-rev-replace gulp-awspublish gulp-jshint jshint-stylish concurrent-transform rimraf run-sequence gulp-ng-annotate --save-dev

# installing bower dependencies
bower install lodash font-awesome firebase angular angularfire jquery bootstrap angular-ui-router sweetalert --save

# build
gulp build
