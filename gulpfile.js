var gulp        = require('gulp'),
	plumber     = require('gulp-plumber'),
	browserSync = require('browser-sync'),
	uglify      = require('gulp-uglify'),
	concat      = require('gulp-concat');

/**
 * Javascript Task
 */
var jsList = [
			'assets/js/modernizr-3.3.1.custom.min.js',
			'assets/js/jquery-1.12.0.min.js',
			'assets/js/jquery.dlmenu.min.js',
			'assets/js/jquery.goup.min.js',
			'assets/js/jquery.fancybox.js',
			'assets/js/jquery.fitvid.min.js',
			'assets/js/simpleJekyllSearch.js',
			'assets/js/scripts.js'
			]
gulp.task('js', function(){
	return gulp.src(jsList)
		.pipe(plumber())
		.pipe(concat('main.js'))
		.pipe(uglify())
		.pipe(gulp.dest('assets/js/'))
		.pipe(browserSync.reload({stream:true}))
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['js']);
