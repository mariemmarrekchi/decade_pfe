var gulp = require('gulp');
var postcss = require('gulp-postcss');
const sass = require('gulp-sass')(require('sass'));
const purgecss = require('gulp-purgecss')
const rename = require('gulp-rename')
var fs = require('fs');
const path = require('path');
const dynamicSourceMapPath = "./.next/react-loadable-manifest.json"
const sourceMapPath = "./.next/build-manifest.json"
const prefixToDelete = "webpack://_N_E/"
const endWithSearchMap = ".js.map"
const endWithSearch = ".js"
const startWithSearch = "_"
const componentStartPath = "./components/Mobile/"
const sameComponents = ["ProductsList", "Search"];


var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');

function getContentData(newPath) {
    let buffer = fs.readFileSync(newPath);
    let fileContent = buffer.toString();
    let objFileContent = JSON.parse(fileContent);
    return objFileContent?.sources
}

function prepareContentForBuild(content, fileName) {
    let filtredContent = content.filter(function (value, index, arr) {
        return (value.includes('/components/Mobile/') || ((value.includes("/./pages/") && !value.includes("/./pages/_"))));
    });
    //prefixToDelete
    Object.keys(filtredContent).forEach(key => {
        filtredContent[key] = filtredContent[key].substring(prefixToDelete.length);
    });
    return filtredContent;

}

function getLoadableComponentByPageName(loadableComponents, pageName) {

    let upperPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    if (sameComponents.includes(upperPageName)) {
        upperPageName = sameComponents[0];
    }
    let mobileLoadableComponent = loadableComponents.filter(function (value, index, arr) {
        if (upperPageName === sameComponents[0]) {
            return (value.includes("/" + upperPageName + "/") || (value.includes("components/Mobile/Filter/")));
        } else {
            return value.includes("/" + upperPageName + "/")
        }

    });
    return mobileLoadableComponent;
}

function prepareDynamicComponentsData(dynamicComponentsData) {
    let paths = []
    dynamicComponentsData.forEach(filePath => {
        const filesPaths = filePath.split('->');
        filesPaths[0] = filesPaths[0].replace(/ /g, "")
        filesPaths[1] = filesPaths[1].replace(/ /g, "")
        paths.push(filesPaths[0].replace('..', '.'))
        if (filesPaths[1].includes("/components")) {
            paths.push('./' + filesPaths[1].substring(filesPaths[1].indexOf("components")) + '.js')
        } else if (filesPaths[1].startsWith("../")) {
            let newPath = componentStartPath + filesPaths[1].replace('../', '');
            paths.push(newPath + '.js')
        } else if (filesPaths[1].startsWith("./")) {
            let pathValue = filesPaths[0].lastIndexOf("/");
            let str = filesPaths[0].substring(0, pathValue)
            paths.push(str.replace('..', '.') + filesPaths[1].replace('./', '/') + '.js')
        }
    })
    // supprimer les redendances
    return [...new Set(paths)]
}

function getDynamicComponentsChunks(mobileLoadableComponent, dynamicComponentsData) {
    let contentPageSources = []
    let traitedFiles = []
    dynamicComponentsData.forEach(fileData => {
        let chunksFile = mobileLoadableComponent[fileData]["files"]
        if (chunksFile.length > 0) {
            chunksFile.forEach(file => {
                file = "./.next/" + file.replace(endWithSearch, endWithSearchMap)
                if (traitedFiles.includes(file)) {
                    return; //
                } else {
                    contentPageSources = contentPageSources.concat(prepareContentForBuild(getContentData(file), ""));
                    traitedFiles.push(file)
                }

            });
        }

    });
    return contentPageSources

}

gulp.task('css-default', function (cb) {
    var processors = [
        autoprefixer,
        cssnano
    ];
    return gulp.src('./styles/sass/default/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors, {
            config: {
                path: './config/default/postcss.config.js'
            }
        }))
        .pipe(gulp.dest('./public/assets/css/default'));
});

gulp.task('css-mobile', function (cb) {
    var processors = [
        autoprefixer,
        cssnano
    ];
    console.info("*** start build css ***")
    let cssFileName = '';
    let loadableManifestData = fs.readFileSync(dynamicSourceMapPath);
    let loadableManifestDataParsed = JSON.parse(loadableManifestData);
    let loadableComponentKeys = Object.keys(loadableManifestDataParsed);
    let mobileLoadableComponent = loadableComponentKeys.filter(function (value, index, arr) {
        return value.includes(componentStartPath);
    });

    if (fs.existsSync(sourceMapPath)) {
        let manifestData = fs.readFileSync(sourceMapPath);
        let manifestDataParsed = JSON.parse(manifestData);
        delete manifestDataParsed.pages['/_app'];
        delete manifestDataParsed.pages['/_error'];
        let pages = Object.keys(manifestDataParsed.pages)
        pages.forEach(fileName => {
            let preparedContent = [];
            let contentPageSources = [];
            let dynamicComponents = [];
            if (fileName === '/') {
                cssFileName = 'home';
            } else {
                let splitedFileName = fileName.split('/');
                cssFileName = splitedFileName[1];
            }
            let dynamicComponentsData = getLoadableComponentByPageName(mobileLoadableComponent, cssFileName)
            if (dynamicComponentsData.length > 0) {
                dynamicComponents = prepareDynamicComponentsData(dynamicComponentsData)
                dynamicComponents = dynamicComponents.concat(getDynamicComponentsChunks(loadableManifestDataParsed, dynamicComponentsData))
            }
            console.info("******* traitament cssFileName ********** ---> ", cssFileName)
            manifestDataParsed?.pages[fileName].forEach(sourcePage => {
                if (sourcePage.includes('/webpack-') || sourcePage.includes('/framework.') || sourcePage.includes('/main-') || sourcePage.includes('/css')) {
                    return // emulating JavaScript forEach continue statement
                }
                sourcePage = "./.next/" + sourcePage.replace(endWithSearch, endWithSearchMap)
                console.log("sourcePage",sourcePage)
                contentPageSources = prepareContentForBuild(getContentData(sourcePage), fileName)
                if (contentPageSources.length > 0) {
                    preparedContent = preparedContent.concat(contentPageSources);
                }
            })
            preparedContent.push(componentStartPath + 'Layout/Header/*.js');
            preparedContent.push(componentStartPath + 'Common/Geolocation/GeograficalLocationContainer.js');
            preparedContent.push('./styles/third-party-html/Mobile/COMMONS/*.html','./styles/third-party-html/Mobile/'+cssFileName.toUpperCase() +'/*.html');
            if (dynamicComponents.length > 0) {
                preparedContent = preparedContent.concat(dynamicComponents);
            }
            preparedContent = [...new Set(preparedContent)]
            console.info("******  after preparedContent ********** ---> " + cssFileName + " : ", preparedContent)
            return gulp.src('./styles/sass/mobile/style.scss')
                .pipe(sass().on('error', sass.logError))
                .pipe(rename(cssFileName + '.css'))
                .pipe(
                    purgecss({
                        content: preparedContent
                    })
                )
                .pipe(postcss(processors))
                .pipe(gulp.dest('./public/assets/css/mobile'));

        })
    } else {
        console.error("*** le fichier ./.next/build-manifest.json n'existe pas ")
    }
    //TODO @montassar refact dans une expression reguliére  AND  supprimer le mobile/customerAccount.css (meet : 30/03/2023)

    //return gulp.src('./styles/sass/mobile/headerFooter.scss')
        //.pipe(sass().on('error', sass.logError))
        //.pipe(postcss(processors, {
            //config: {
              //  path: './config/mobile/postcss.config.js'
           // }
       // }))
        //.pipe(rename("headerFooter.css"))
        //.pipe(gulp.dest('./public/assets/css/mobile'));

    return gulp.src('./styles/sass/mobile/headerFooter.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors, {
            config: {
                path: './config/mobile/postcss.config.js'
            }
        }))
        .pipe(rename("headerFooter.css"))
        .pipe(gulp.dest('./public/assets/css/mobile'));

});
gulp.task('css-responsive', function (cb) {
    var processors = [
        autoprefixer,
        cssnano
    ];
    return gulp.src('./styles/sass/responsive/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors, {
            config: {
                path: './config/responsive/postcss.config.js'
            }
        }))
        .pipe(gulp.dest('./public/assets/css/responsive'));
});
gulp.task('css-mobile-watch', function (cb) {
     let processors = [
        autoprefixer,
        cssnano
    ];

    let files = fs.readdirSync('./pages');
    let filteredFiles = files.filter(function (value, index, arr) {
        return !value.startsWith(startWithSearch)
    });
    filteredFiles.forEach(fileName => {
        fileName = ((fileName.substring(0, fileName.lastIndexOf('.')) || fileName) === 'index' ? 'home' : fileName) + '.css'
        return gulp.src('./styles/sass/mobile/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(rename(fileName))
           .pipe(postcss(processors, {
               config: {
                   path: './config/mobile/postcss.config.js'
               }
           }))
            .pipe(gulp.dest('./public/assets/css/mobile'));

    });


});

// Watch Files For Changes in mobile
gulp.task('watch-mobile', function () {
    // livereload.listen();
    console.info("start watch-mobile ..... ")
    gulp.watch('./styles/sass/mobile/**/*.scss', gulp.series('css-mobile-watch'))
        .on('change', function (evt) {
            console.info('[watcher] File : ', evt);
        });
});

// Watch Files For Changes in default
gulp.task('watch-default', function () {
    // livereload.listen();
    console.log("start watch ")
    gulp.watch('../styles/sass/default/**/*.scss', gulp.series('css-default'))
        .on('change', function (evt) {
            console.log('[watcher] File ', evt);
        });
});
gulp.task('css', gulp.series('css-default', 'css-mobile','css-responsive'));
//gulp.task('css', gulp.series('css-responsive'));
