// https://www.liquidlight.co.uk/blog/article/how-do-i-update-to-gulp-4/

const remoteHostname = 'rpi';
const remoteTargetDir = '/home/pi/nibe1155/server';

const fs = require('fs');

const gulp         = require('gulp4'),
      gChanged     = require('gulp-changed'),
      gReplace     = require('gulp-replace'),
      gRsync       = require('gulp-rsync'),
      gSsh         = require('gulp-ssh'),
      gSourcemaps  = require('gulp-sourcemaps'),
      gTypescript  = require('gulp-typescript'),
      gUsing       = require('gulp-using');
      del          = require('del'),
      merge        = require('merge-stream'),
      nconf        = require('nconf'),
      vfs          = require('vinyl-fs');

// const gulpDebug = require('gulp-debug');

const verbose = 0;
let hasError = false;
let finalMessage = '';
const sep = '----------------------------------------------------------------------------';
const remoteConfig = nconf.file('remote.json').get();
console.log(__dirname, remoteConfig);

const tsProject = gTypescript.createProject("tsconfig.json");

const sshConfig = {
    host: 'rpi',
    port: 22,
    username: 'pi',
    privateKey: fs.readFileSync('/home/steiner/.ssh/id_rsa_rpi')
}
var ssh = new gSsh({
    ignoreErrors: false,
    sshConfig: sshConfig
});


gulp.task('clean', function () {
    if (verbose) { console.log("Task clean gestartet"); }
    const toDelete = [ 'dist/*' ];
    for (let s of toDelete) {
        if (verbose > 1) { console.log(' --> deleting ' + s); }
    }
    return del(toDelete);
});

gulp.task('transpile', function () {
    return gulp.src('src/**/*.ts', { follow: true, followSymlinks: true })
        .pipe(gChanged('dist', { extension: '.js'}))
        .pipe(gUsing( { prefix:'  --> Transpiling file', path:'cwd', color:'green', filesize:false } ))
        .pipe(gSourcemaps.init())
        .pipe(tsProject( { error: myReporter, finish: myFinishHandler } ))
        .pipe(gSourcemaps.mapSources(
            function(sourcePath, file) {
                return sourcePath.substr(0);
            }))
        .pipe(gSourcemaps.write('./', { sourceRoot: __dirname + '/src'} ))
        .pipe(gulp.dest('dist'));
});

gulp.task('copyFiles', function () {
    const copyPugViews =
        gulp.src('src/views/**/*.pug')
            .pipe(gChanged('dist/views', { extension: '.pug' }))
            .pipe(gUsing({prefix:'  --> Copying file', path:'cwd', color:'blue', filesize:false}))
            .pipe(gulp.dest('dist/views/'));

    const copyPublic =
        gulp.src('src/public/**/*')
            .pipe(gChanged('dist/public', { }))
            .pipe(gUsing({prefix:'  --> Copying file', path:'cwd', color:'blue', filesize:false}))
            .pipe(gulp.dest('dist/public/'));

    return merge(copyPugViews, copyPublic);
});

gulp.task('dist_remote', function(done) {
    if (remoteConfig && remoteConfig.disabled) {
        if (verbose) {
            console.log('task dist_remote: skipping because remote platform disabled (see file remote.json)');
        }
        done();
        return;
    }
    const rv1 = gulp.src(['dist/**/*.js.map'])
        .pipe(gReplace(__dirname + '/src', remoteTargetDir + '/src' ))
        .pipe(gulp.dest('dist_remote/'));

    const rv2 = gulp.src(['dist/**/*.js'])
        .pipe(gulp.dest('dist_remote/'));

    return merge(rv1, rv2);
});

gulp.task('copyToRemote', function(done) {
    if (remoteConfig && remoteConfig.disabled) {
        if (verbose) {
            console.log('task copyToRemote: skipping because remote platform disabled (see file remote.json)');
        }
        done();
        return;
    }

    const rsyncSrc =
        vfs.src('src/**')
            // .pipe(gulpDebug())
            .pipe(gRsync({
                root: 'src/',
                hostname: remoteHostname,
                destination: remoteTargetDir + '/src/',
                emptyDirectories: true,
                links: true
            }));

    const rsyncDist =
        gulp.src('dist_remote/**')
            .pipe(gRsync({
                root: 'dist_remote/',
                hostname: remoteHostname,
                destination: remoteTargetDir + '/dist/'
        }));

    const rsyncOthers =
        gulp.src(['package.json', 'README*'])
            .pipe(gRsync({
                root: '',
                hostname: remoteHostname,
                destination: remoteTargetDir + '/'
        }));


    return merge(rsyncSrc, rsyncDist, rsyncOthers);
});

gulp.task('remotePlatform', function (done) {
    if (remoteConfig && remoteConfig.disabled) {
        if (verbose) {
            console.log('task remotePlatform: skipping because remote platform disabled (see file remote.json)');
        }
        done();
        return;
    }
    gulp.series(['dist_remote', 'copyToRemote'], function(done2) {
        done2();
        done();
    })();
})

gulp.task('remoteStart', function (done) {
    // return ssh.exec(['cd ' + remoteTargetDir, 'nodemon --inspect=0.0.0.0:9229 --inspect-brk=0.0.0.0:9229 dist/main.js'], {filePath: 'ssh.log'})
    //     .on('data', function (file) { console.log(file.contents.toString())
    // });
    ssh.on('error', function(err) { console.log(err); })
    ssh.shell(
        ['cd ' + remoteTargetDir, 'killall node', 'nohup node --inspect=0.0.0.0:9229 --inspect-brk=0.0.0.0:9229 dist/main.js &']
        // ['cd ' + remoteTargetDir, 'nodemon --inspect=0.0.0.0:9229 --inspect-brk=0.0.0.0:9229 dist/main.js']
        //, {filePath: 'shell.log'}
    )
    // .on('data', function (file) { console.log(file.contents.toString()) })
    
    done();
});

gulp.task('build', gulp.series(['transpile', 'copyFiles']));
gulp.task('buildAndLaunchOnRemote', gulp.series(['build', 'remotePlatform', 'remoteStart' ]));
gulp.task('start', gulp.series(['build', 'remoteStart']));
gulp.task('default', gulp.series('start'));


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

