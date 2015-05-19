var path = require('path'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch'),
    rimraf = require('gulp-rimraf'),
    nodemon = require('gulp-nodemon'),
    rename = require("gulp-rename"),
    order = require('gulp-order'),
    _ = require('lodash');

gulp.task('build-client-js', function(){
    return gulp.src('client/js/**/*.js')
        .pipe(order([
            "d3/*.js",
            "angular/wikitree.module.js",
            "angular/wikitree.routes.js",
            "angular/services/*.js",
            "angular/search/*.module.js",
            "angular/search/*.js",
            "angular/home/*.module.js",
            "angular/home/*.js",
            "angular/main/*.module.js",
            "angular/main/*.js",
            "angular/main/menu/*.module.js",
            "angular/main/menu/*.js",
            "angular/main/menu/session/*.module.js",
            "angular/main/menu/session/*.js",
            "angular/main/reader/*.module.js",
            "angular/main/reader/*.js",
            "angular/main/graph/*.module.js",
            "angular/main/graph/*.js",
            "angular/main/resizer/*.module.js",
            "angular/main/resizer/*.js"
        ]))
        .pipe(concat("app.js"))
        .pipe(gulp.dest("client/build"));
});

gulp.task('build', function(){
    gulp.start('build-client-js');
});

gulp.task('clean',function() {
    return gulp.src(['client/build'], { read: false })
        .pipe(rimraf());
});

gulp.task('dev', function() {
    // runs nodemon on the server file and executed the default task
    nodemon({
        script: 'server/server.js',
        ext: 'js',
        ignore: ['node_modules/**']
    }).on('restart', ['default']);

    gulp.start("default");
});

gulp.task('default', ['clean'], function(){
    gulp.start("build");
    watch("client/js/**/*.js", function() {
        gulp.start('build-client-js');
    });
});

// ** stub for running unit & integration tests
gulp.task('test', function(){
    return;
});

// ** commented out in case heroku is used at any time (using a gulp buildpack)
//gulp.task('heroku:production', function() {
//    gulp.start("build");
//});
//
//gulp.task('heroku:development', function() {
//    gulp.start("build");
//});