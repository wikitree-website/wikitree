var del = require('del');
var path = require('path');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var watch = require('gulp-watch');
var nodemon = require('gulp-nodemon');
var mincss = require('gulp-minify-css');
var rename = require('gulp-rename');
var clone = require('gulp-clone');
var order = require('gulp-order');
var debug = require('gulp-debug');
var sourcemaps = require('gulp-sourcemaps');
var es = require('event-stream');

gulp.task('build-client-css', function() {

    var allCSS = gulp.src([
        path.join(
            __dirname,
            'client',
            'css',
            'style.css'
        )
    ])
        .pipe(concat('app.css'));

    var minCSS = allCSS.pipe(clone())
        .pipe(sourcemaps.init())
        .pipe(mincss())
        .pipe(sourcemaps.write())
        .pipe(rename('app.min.css'));

    return es.merge(allCSS, minCSS)
        .pipe(gulp.dest(
            path.join(
                __dirname,
                'client',
                'build'
            )
        ));
});

gulp.task('build-client-js', function(){

    // write all files, in order to a concat file
    var allJS = gulp.src(path.join(__dirname, 'client', 'js', '**', '*.js'))
        .pipe(order([
            'd3/*.js',
            'angular/wikitree.module.js',
            'angular/wikitree.routes.js',
            'angular/services/*.js',
            'angular/search/*.module.js',
            'angular/search/*.js',
            'angular/home/*.module.js',
            'angular/home/*.js',
            'angular/main/*.module.js',
            'angular/main/*.js',
            'angular/main/menu/*.module.js',
            'angular/main/menu/*.js',
            'angular/main/menu/session/*.module.js',
            'angular/main/menu/session/*.js',
            'angular/main/reader/*.module.js',
            'angular/main/reader/*.js',
            'angular/main/graph/*.module.js',
            'angular/main/graph/*.js',
            'angular/main/resizer/*.module.js',
            'angular/main/resizer/*.js'
        ]))
        .pipe(concat('app.js'));

    // copy the concat file, uglify and rename
    var minJS = allJS.pipe(clone())
        .pipe(uglify().on('error', console.log))
        .pipe(rename('app.min.js'));

    // merge the two files to one dest
    return es.merge(allJS, minJS)
        .pipe(gulp.dest(
            path.join(
                __dirname,
                'client',
                'build'
            )
        ));

});

gulp.task('build', ['build-client-css', 'build-client-js'], function(){
    return;
});

gulp.task('clean',function(cb) {
    del(['client/build/**/*'], cb);
});

gulp.task('dev', function() {
    // runs nodemon on the server file and executed the default task
    nodemon({
        script: path.join(
            __dirname,
            'server',
            'server.js'
        ),
        ext: 'js',
        ignore: ['node_modules/**']
    }).on('restart', ['default']);

    gulp.start('default');
});

gulp.task('default', ['clean'], function(){

    gulp.start('build');

    watch(path.join(
        __dirname,
        'client',
        'js',
        '**',
        '*.js'
    ), function() {
        gulp.start('build-client-js');
    });

    watch(path.join(
        __dirname,
        'client',
        'css',
        'style.css'
    ), function() {
        gulp.start('build-client-css');
    });

});

// ** stub for running unit & integration tests
gulp.task('test', function(){
    return;
});
