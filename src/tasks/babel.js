import gutil from 'gulp-util';
import plumber from 'gulp-plumber';
import cache from 'gulp-cached';
import changed from 'gulp-changed';
import sourcemaps from 'gulp-sourcemaps';
import coffee from 'gulp-coffee';
import to5 from 'gulp-babel';
import ngAnnotate from 'gulp-ng-annotate';
import rename from 'gulp-rename';
import _isUndefined from 'lodash/lang/isUndefined';
import _merge from 'lodash/object/merge';
import _forEach from 'lodash/collection/forEach';

let defaultCompilerOptions = {
	externalHelpers: true,
	comments: false,
	compact: false
};

class BabelTask {
	setOptions(options) {
		this.options = options;

		if (_isUndefined(this.options.src)) {
			throw new Error('BabelTask: src is missing from configuration!');
		}

		if (_isUndefined(this.options.dest)) {
			throw new Error('BabelTask: dest is missing from configuration!');
		}

		if (this.options.notify) {
			this.options.plumberOptions = this.options.defaultErrorHandler;
		}

		// Handle defaults
		this.options.compilerOptions = _merge({}, defaultCompilerOptions, this.options.compilerOptions);
		this.options.coffeeOptions = _merge({bare: true}, this.options.coffeeOptions);
		this.options.ngAnnotateOptions = _merge({sourceMap: true}, this.options.ngAnnotateOptions);
		this.options.plumberOptions = _merge({}, this.options.plumberOptions);

		return this;
	}

	defineTask(gulp) {
		let options = this.options;

		gulp.task(options.taskName, options.taskDeps, () => {
			let chain = gulp.src(options.src);

			chain = chain
				.pipe(cache(options.taskName))
				.pipe(plumber(options.plumberOptions))
				.pipe(changed(options.dest, {extension: '.js'}))
				.pipe(rename(function(path) {
					if (path.extname === '.jsx') {
						path.extname = '.js';
					}
				}))
				.pipe(sourcemaps.init());

			if (options.coffee) {
				chain = chain.pipe(coffee(options.coffeeOptions).on('error', gutil.log));
			}

			chain = chain.pipe(to5(options.compilerOptions));

			if (options.ngAnnotate) {
				chain = chain.pipe(ngAnnotate(options.ngAnnotateOptions));
			}

			chain = chain.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(options.dest));

			_forEach(options.globalBrowserSyncs, (bs) => {
				chain = chain.pipe(bs.stream({match: '**/*.js'}));
			});

			return chain;
		});
	}
}

module.exports = BabelTask;
module.exports.compilerOptions = defaultCompilerOptions;
