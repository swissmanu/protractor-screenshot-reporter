var util = require('./lib/util')
	, mkdirp = require('mkdirp')
	, path = require('path');

/** Function: defaultPathBuilder
 * This function builds paths for a screenshot file. It is appended to the
 * constructors base directory and gets prependend with `.png` or `.json` when
 * storing a screenshot or JSON meta data file.
 *
 * Parameters:
 *     (Object) spec - The spec currently reported
 *     (Array) descriptions - The specs and their parent suites descriptions
 *     (Object) result - The result object of the current test spec.
 *     (Object) capabilities - WebDrivers capabilities object containing
 *                             in-depth information about the Selenium node
 *                             which executed the test case.
 *
 * Returns:
 *     (String) containing the built path
 */
function defaultPathBuilder(spec, descriptions, results, capabilities) {
	return util.generateGuid();
}

/** Function: defaultMetaDataBuilder
 * Uses passed information to generate a meta data object which can be saved
 * along with a screenshot.
 * You do not have to add the screenshots file path since this will be appended
 * automatially.
 *
 * Parameters:
 *     (Object) spec - The spec currently reported
 *     (Array) descriptions - The specs and their parent suites descriptions
 *     (Object) result - The result object of the current test spec.
 *     (Object) capabilities - WebDrivers capabilities object containing
 *                             in-depth information about the Selenium node
 *                             which executed the test case.
 *
 * Returns:
 *     (Object) containig meta data to store along with a screenshot
 */
function defaultMetaDataBuilder(spec, descriptions, results, capabilities) {
	var metaData = {
			description: descriptions.join(' ')
			, passed: results.passed()
			, os: capabilities.caps_.platform
			, browser: {
				name: capabilities.caps_.browserName
				, version: capabilities.caps_.version
			}
		};

	if(results.items_.length > 0) {
		var result = results.items_[0];
		metaData.message = result.message;
		metaData.trace = result.trace.stack;
	}

	return metaData;
}



/** Class: ScreenshotReporter
 * Screenshot Reporter for Protractor:
 * Running functional E2E tests using Protractor is nice. Executing them on a
 * remote and/or virtualized Selenium Grid improves the productivity even more.
 * But at least when a test case fails, you may become curious about the actual
 * rendered output of the browser which runned the test.
 *
 * The protractor-screenshot-reporter creates a screenshot for each executed
 * test. Along with a JSON file containining the test outcome, it gets saved on
 * the machine which runs Protractor.
 *
 * This allows a deeper analysis of what happend during a failed test.
 *
 *
 * Usage:
 * The `protractor-screenshot-reporter` is available via npm:
 *
 *     npm install protractor-screenshot-reporter --save-dev
 *
 * In your Protractor configuration file, register
 * `protractor-screenshot-reporter` in Jasmine:
 *
 *     var ScreenShotReporter = require('protractor-screenshot-reporter');
 *
 *     exports.config = {
 *
 *         // your config here ...
 *
 *         onPrepare: function() {
 *             // Add a screenshot reporter and store screenshots into
 *             // `./test/screenshots`:
 *             jasmine.getEnv().addReporter(new ScreenShotReporter('./test/screenshots'));
 *         }
 *    };
 *
 *
 * Configuration: Path Builder:
 * The function passed as second argument is used to build up paths for
 * screenshot files. The following example is the default implementation if you
 * pass nothing:
 *
 *     function defaultPathBuilder(spec, descriptions, results, capabilities) {
 *         return util.generateGuid();
 *     }
 *
 * Use this as a blueprint for your own path builders.
 *
 *
 * Configuration: Meta Data Builder:
 * You can modify the contents of the JSON meta data file by passing a function
 * `metaDataBuilder` function as third parameter.
 * Following example shows the default implementation which is used if you pass
 * nothing. Use it as example when developing your own customizations of it:
 *
 *     function defaultMetaDataBuilder(spec, descriptions, results
 *         , capabilities) {
 *
 *         var metaData = {
 *                 description: specDescriptions.join(' ')
 *                 , passed: results.passed()
 *                 , os: capabilities.caps_.platform
 *                 , browser: {
 *                     name: capabilities.caps_.browserName
 *                     , version: capabilities.caps_.version
 *                 }
 *             };
 *
 *         if(results.items_.length > 0) {
 *             result = results.items_[0];
 *             metaData.message = result.message;
 *             metaData.trace = result.trace.stack;
 *         }
 *
 *         return metaData;
 *     }
 *
 *
 * Parameters:
 *     (String) baseDirectory - The path to the directory where screenshots are
 *                              stored. If not existing, it gets created.
 *     (Function) pathBuilder - A function which returns a path for a screenshot
 *                              to be stored.
 *     (Function) metaDataBuilder - Function which returns an object literal
 *                                  containing meta data to store along with
 *                                  the screenshot.
 */
function ScreenshotReporter(baseDirectory, pathBuilder, metaDataBuilder) {
	if(!baseDirectory || baseDirectory.length === 0) {
		throw new Error('Please pass a valid base directory to store the ' +
			'screenshots into.');
	}

	if(!pathBuilder) {
		pathBuilder = defaultPathBuilder;
	}
	if(!metaDataBuilder) {
		metaDataBuilder = defaultMetaDataBuilder;
	}

	this.baseDirectory = baseDirectory;
	this.pathBuilder = pathBuilder;
	this.metaDataBuilder = metaDataBuilder;
}

/** Function: reportSpecResults
 * Called by Jasmine when reporteing results for a test spec. It triggers the
 * whole screenshot capture process and stores any relevant information.
 *
 * Parameters:
 *     (Object) spec - The test spec to report.
 */
ScreenshotReporter.prototype.reportSpecResults =
function reportSpecResults(spec) {
	/* global browser */
	var self = this;

	browser.takeScreenshot().then(function (png) {
		browser.getCapabilities().then(function (capabilities) {
			var descriptions = util.gatherDescriptions(
					spec.suite
					, [spec.description]
				)
				, results = spec.results()

				, baseName = self.pathBuilder(
					spec
					, descriptions
					, results
					, capabilities
				)
				, metaData = self.metaDataBuilder(
					spec
					, descriptions
					, results
					, capabilities
				)

				, screenShotFile = baseName + '.png'
				, metaFile = baseName + '.json'
				, screenShotPath = path.join(self.baseDirectory, screenShotFile)
				, metaDataPath = path.join(self.baseDirectory, metaFile)

				// pathBuilder can return a subfoldered path too. So extract the
				// directory path without the baseName
				, directory = path.dirname(baseName);


			metaData.screenShotFile = screenShotPath;
			mkdirp(directory, function(err) {
				if(err) {
					throw new Error('Could not create directory ' + directory);
				} else {
					util.storeScreenShot(png, screenShotPath);
					util.storeMetaData(metaData, metaDataPath);
				}
			});
		});
	});

};

module.exports = ScreenshotReporter;