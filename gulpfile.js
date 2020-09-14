const gulp = require('gulp');
const shell = require('gulp-shell');
const browserSync = require('browser-sync').create();

gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: './spine-ts'
        },
        startPath: '/webgl/example/test.html',
        port: '8019'
    });

    gulp.watch('./spine-ts/webgl/example/**/*').on(
        'change',
        browserSync.reload
    );

    gulp.watch(
        ['./spine-ts/webgl/src/**/*', './spine-ts/core/**/*'],
        gulp.series([
            'build',
            function reload(done) {
                browserSync.reload();
                done();
            }
        ])
    );
});

gulp.task('build', shell.task('tsc -p spine-ts/tsconfig.webgl.json'));
