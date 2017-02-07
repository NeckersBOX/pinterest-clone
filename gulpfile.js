'use strict';

const gulp = require ('gulp');
const minify = require ('gulp-minify');
const sass = require ('gulp-sass');

gulp.task ('sass', () =>
  gulp.src ('src/sass/*.sass').pipe (sass ({
    outputStyle: 'compressed'
  }))
  .pipe (gulp.dest ('dist/css/'))
);

gulp.task ('minify-js', () =>
  gulp.src ('src/js/*.js')
    .pipe (minify ({
      ext: {
        src:'.js',
        min:'.min.js'
      }
    }))
    .pipe (gulp.dest ('dist/js'))
);

gulp.task ('build', [ 'sass', 'minify-js' ]);
gulp.task ('watch', () => {
  gulp.watch ('src/sass/*.sass', [ 'sass' ]);
  gulp.watch ('src/js/*.js', [ 'minify-js' ]);
});
