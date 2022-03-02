const gulp = require('gulp');
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const terser = require('gulp-terser-js');
const cssnano = require('cssnano');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const headerComment = require('gulp-header-comment');
//const pkg = require('./package.json');
const fs = require('fs');
const args = require('yargs/yargs')(process.argv.slice(2)).argv;
const { EOL } = require('os');

const paths = {
    theme: {
        root: './theme',
        sass: './.sass',
        css: './theme/css',
        js: './theme/js',
        elements: './theme/elements',
    },
};

const minifiedTemplate = `{#
# Attention!
# This file was created automatically by compilation process.
# Please do not modify this file if you do not know what you are doing.
#
# The files styles.tpl and scripts.tpl should exists in the path snipplets/layout
# together with this file.
#}`;

/**
 * GULP ACTIONS
 * Todas as funções que são chamadas diretamente pelo Gulp são actions e devem ser colocadas abaixo dessa marcação.
 */
function createMinifiedVariableFile(cb) {
    let fileData = minifiedTemplate;

    fileData += args.local ? `${EOL}${EOL}{% set minified = false %}` : `${EOL}${EOL}{% set minified = true %}`;

    fs.writeFileSync(`${paths.theme.elements}/minified.tpl`, fileData);

    cb();
}

/**
 * Compile sass files into css and autoprefixer
 * @returns {*}
 */
function processSass() {
    return gulp
        .src(`${paths.theme.sass}/**/*.scss`)
        .pipe(
            sass({
                outputStyle: 'expanded',
                includePaths: ['node_modules'],
            }).on('error', sass.logError)
        )
        .pipe(postcss([autoprefixer]))
        .pipe(gulp.dest(paths.theme.css));
}

/**
 * Generate minified css files
 * @returns {*}
 */
function minifyCSS() {
    return gulp
        .src([`${paths.theme.css}/*.css`, `!${paths.theme.css}/*.min.css`], { sourcemaps: true })
        .pipe(postcss([cssnano]))
        .pipe(rename({ suffix: '.min' }))
        .pipe(
            headerComment(
                `@theme <%= pkg.theme %>
             @version <%= pkg.version %>
             @author <%= pkg.author %>
             @site <%= pkg.homepage %>
            `
            )
        )
        .pipe(gulp.dest(paths.theme.css));
}

/**
 * Watch any changes
 */
function watchFiles(cb) {
    gulp.watch(`${paths.theme.sass}/**/*.scss`, processSass, cb);
}

/**
 * Concat basic js libs into single file.
 * Load libs from node_modules.
 * @returns {*}
 */
function concatLibsJs() {
    return gulp
        .src([
            'node_modules/lazysizes/lazysizes.min.js',
            'node_modules/lazysizes/plugins/parent-fit/ls.parent-fit.js',
            'node_modules/swiper/swiper-bundle.min.js',
            'node_modules/jquery-mask-plugin/dist/jquery.mask.min.js',
            'node_modules/jquery-validation/dist/jquery.validate.min.js',
        ])
        .pipe(concat('libs.js'))
        .pipe(gulp.dest(paths.theme.js));
}

/**
 * Generate minified js files
 * @returns {*}
 */
function minifyJS() {
    return gulp
        .src([`${paths.theme.js}/**/*.js`, `!${paths.theme.js}/**/*.min.js`], { sourcemaps: true })
        .pipe(terser({ mangle: { toplevel: true } }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(
            headerComment(
                `@theme <%= pkg.theme %>
             @version <%= pkg.version %>
             @author <%= pkg.author %>
             @site <%= pkg.homepage %>
            `
            )
        )
        .pipe(gulp.dest(paths.theme.js));
}

/**
 * GULP TASKS
 * Tarefas que poderão ser executadas pelo gulp.
 */
const build = gulp.series(createMinifiedVariableFile, processSass, minifyCSS, concatLibsJs, minifyJS);
const start = gulp.series(createMinifiedVariableFile, processSass, concatLibsJs, minifyJS, watchFiles);

exports.generate = createMinifiedVariableFile;
exports.build = build;
exports.default = start;
