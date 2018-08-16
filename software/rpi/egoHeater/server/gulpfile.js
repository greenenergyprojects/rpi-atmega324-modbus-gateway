const remoteHostname = 'rpi';
const remoteTargetDir = '/home/pi/egoHeater';


const gulp = require('gulp'),
      changed = require('gulp-changed'),
      gulpDebug = require('gulp-debug'),
      del = require('del'),
      path = require('path'),
      ts = require('gulp-typescript'),
      sourcemaps = require('gulp-sourcemaps'),
      using = require('gulp-using'),
      typescript = require('typescript'),
      sequence = require('run-sequence'),
      merge = require('merge-stream'),
      rsync = require('gulp-rsync'),
      vfs = require('vinyl-fs');

const tsProject = ts.createProject("tsconfig.json");

let hasError = false;
let finalMessage = '';
const sep = '----------------------------------------------------------------------------';

gulp.task('default', [ 'run' ]);

gulp.task('run', [ 'build' ]);

gulp.task('cleanAndBuild', function (done) {
    sequence('clean', 'build', done);
});

gulp.task('build', function (done) {
    console.log("Task build gestartet");
    sequence('transpile', 'copyFiles', 'rsyncFiles', () => {
        console.log(finalMessage);
    });
});

gulp.task('clean', function (done) {
    console.log("Task clean gestartet");
    const toDelete = [ 'dist/*' ];
    for (let s of toDelete) {
        console.log(' --> deleting ' + s);
    }
    return del(toDelete);
});

gulp.task('transpile', function (done) {
    const tsResult = gulp.src('src/**/*.ts', { follow: true, followSymlinks: true })
                         .pipe(changed('dist', { extension: '.js'}))
                         .pipe(using( { prefix:'  --> Transpiling file', path:'cwd', color:'green', filesize:false } ))
                         .pipe(sourcemaps.init())
                         .pipe(tsProject( { error: myReporter, finish: myFinishHandler } ))
                         .js.pipe(sourcemaps.mapSources(
                             function(sourcePath, file) {
                                 return sourcePath.substr(0);
                             }))
                         .pipe(sourcemaps.write('./', { sourceRoot: __dirname } ))
                         .pipe(gulp.dest('dist'));
    return tsResult;
});


gulp.task('copyFiles', function (done) {
    const copyPugViews =
        gulp.src('src/views/**/*.pug')
            .pipe(changed('dist/views', { extension: '.pug' }))
            .pipe(using({prefix:'  --> Copying file', path:'cwd', color:'blue', filesize:false}))
            .pipe(gulp.dest('dist/views/'));

    const copyPublic =
        gulp.src('src/public/**/*')
            .pipe(changed('dist/public', { }))
            .pipe(using({prefix:'  --> Copying file', path:'cwd', color:'blue', filesize:false}))
            .pipe(gulp.dest('dist/public/'));

    return merge(copyPugViews, copyPublic);
});

gulp.task('rsyncFiles', function (done) {
    // const rsyncSrc =
    //     gulp.src(['src/**', '!src/client'],)
    //         .pipe(rsync({
    //             root: 'src/',
    //             hostname: remoteHostname,
    //             destination: remoteTargetDir + '/server/src/'
    //     }));
    const rsyncSrc =
        vfs.src('src/**')
            // .pipe(gulpDebug())
            .pipe(rsync({
                root: 'src/',
                hostname: remoteHostname,
                destination: remoteTargetDir + '/server/src/',
                emptyDirectories: true,
                links: true
            }));

    const rsyncDist =
        gulp.src('dist/**')
            .pipe(rsync({
                root: 'dist/',
                hostname: remoteHostname,
                destination: remoteTargetDir + '/server/dist/'
        }));
    // const rsyncGit =
    //     gulp.src('.git/**')
    //         .pipe(rsync({
    //             root: '.git/',
    //             hostname: remoteHostname,
    //             destination: remoteTargetDir + '/.git/'
    //     }));

    const rsyncOthers =
        gulp.src(['package.json', 'README.md'])
            .pipe(rsync({
                root: '',
                hostname: remoteHostname,
                destination: remoteTargetDir + '/server'
        }));

    const rsyncClient =
        gulp.src(['../ngx/dist/**', '../ngx/src/**'])
            //.pipe(gulpDebug())
            .pipe(rsync({
                root: '../',
                hostname: remoteHostname,
                destination: remoteTargetDir
        }));

    // return merge(rsyncSrc, rsyncDist, rsyncGit, rsyncOthers);
    //return merge(rsyncSrc);
    return merge(rsyncSrc, rsyncDist, rsyncOthers, rsyncClient);

});

const cache = {};

function myReporter (error)  {
    if (cache[error.message]) {
        return;
    }
    cache[error.message] = true;
	  console.log(error.message);
}


function myFinishHandler (results) {
    let msg = sep;

    const showErrorCount = (count, errorTyp) => {
        if (count === 0) {
              return;
        }
        hasError = true;
        msg += '\nTypescript: ' + count.toString() + ' ' + errorTyp + ' errors.';
    }

    showErrorCount(results.transpileErrors, '');
    showErrorCount(results.optionsErrors, 'options');
    showErrorCount(results.syntaxErrors, 'syntax');
	  showErrorCount(results.globalErrors, 'global');
	  showErrorCount(results.semanticErrors, 'semantic');
	  showErrorCount(results.declarationErrors, 'declaration');
	  showErrorCount(results.emitErrors, 'emit');

    if (hasError) {
        msg += '\n' + sep;
    }

    if (results.emitSkipped) {
	      msg += '\nTypeScript: emit failed';
  	} else if (hasError) {
		    msg += '\nTypeScript: emit succeeded (with errors)';
	  } else {
        msg += '\nTypeScript: emit succeeded (no errors)';
    }

    finalMessage = msg;
}
