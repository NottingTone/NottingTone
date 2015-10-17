var gulp          = require('gulp');
var minifyEjs     = require('gulp-minify-ejs');
var uglify        = require('gulp-uglify');
var uglifycss     = require('gulp-uglifycss');
var eslint        = require('gulp-eslint');
var csslint       = require('gulp-csslint');
var del           = require('del');


// 压缩前端ejs
gulp.task('uglify:ejs', function(cb) {
	return gulp.src(['web/views/*.ejs', 'web/modules/*/views/*.ejs'], {base: 'web/'})
		.pipe(minifyEjs({
			spare: true
		}))
		.pipe(gulp.dest('dist'))
		.on('finish', cb);
});

// 压缩前端js
gulp.task('uglify:js', function(cb) {
	return gulp.src(['web/modules/*/js/*.js'], {base: 'web/'})
		.pipe(uglify())
		.pipe(gulp.dest('dist'))
		.on('finish', cb);
});

// 压缩前端css
gulp.task('uglify:css', function(cb) {
	return gulp.src(['web/modules/*/css/*.css'], {base: 'web/'})
		.pipe(uglifycss())
		.pipe(gulp.dest('dist'))
		.on('finish', cb);
});

// 复制不需要压缩的代码到dist
gulp.task('build:copy', function(cb) {
	return gulp.src(['web/package.json', 'web/*.js', 'web/bin/*', 'web/modules/*/public/**'], {base: 'web/'})
		.pipe(gulp.dest('dist'))
		.on('finish', cb);
});

// 审查前端js
gulp.task('lint:js-frontend', function(cb) {
	return gulp.src(['web/modules/*/js/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.on('finish', cb);
});

// 审查后端js
gulp.task('lint:js-backend', function(cb) {
	return gulp.src(['tools/*.js', 'web/*.js', 'web/modules/*.js', 'web/modules/*/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.on('finish', cb);
});

// 审查前端css
gulp.task('lint:css', function(cb) {
	return gulp.src(['web/modules/*/css/*.css'])
		.pipe(csslint())
		.pipe(csslint.reporter())
		.on('finish', cb);
});

// 清理生成的文件
gulp.task('clean', function(cb) {
	return del(['dist/**'], { force: true }, cb);
})

// 将代码压缩并复制到dist
gulp.task('build', gulp.series(['uglify:ejs', 'uglify:js', 'uglify:css', 'build:copy']));

// 审查前端代码
gulp.task('lint-frontend', gulp.series(['lint:js-frontend', 'lint:css']));

// 审查后端代码
gulp.task('lint-backend', gulp.series(['lint:js-backend']));

// 审查全部代码
gulp.task('lint', gulp.series(['lint-frontend', 'lint-backend']));

// 默认执行build
gulp.task('default', gulp.series(['build']));
