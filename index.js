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

/** Function: structuredPathBuilder
 * This function builds paths for a screenshot file based on the OS, the
 * browser and the browser version. It is appended to the
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
function structuredPathBuilder(spec, descriptions, results, capabilities) {
	// Only the major browser version
	var browserVersion = capabilities.caps_.version.substring(0, capabilities.caps_.version.indexOf('.') || capabilities.caps_.version.length);
	var pathStr = capabilities.caps_.platform + path.sep + capabilities.caps_.browserName + path.sep + 
			browserVersion + path.sep; + util.generateGuid();
	var filename = descriptions.join('_');
	return (pathStr + path.sep + filename).toLowerCase();
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
			description: descriptions.reverse().join(' ')
			, passed: results.passedExpectations
			, os: capabilities.caps_.platform
			, browser: {
				name: capabilities.caps_.browserName
				, version: capabilities.caps_.version
			}
		};

	if(results.failedExpectations.length > 0) {
		var result = results.failedExpectations[0];
		metaData.message = result.message;
		metaData.trace = result.stack;
	}else if(results.passedExpectations.length > 0) {
		var result = results.passedExpectations[0];
		metaData.message = result.message;
	}

	return metaData;
}



/** Class: ScreenshotReporter
 * Creates a new screenshot reporter using the given `options` object.
 *
 * For more information, please look at the README.md file.
 *
 * Parameters:
 *     (Object) options - Object with options as described below.
 *
 * Possible options:
 *     (String) baseDirectory - The path to the directory where screenshots are
 *                              stored. If not existing, it gets created.
 *                              Mandatory.
 *     (Boolean) useStructuredPath - Whether to store under OS/Browser/Version
 *                              paths.
 *     (Function) pathBuilder - A function which returns a path for a screenshot
 *                              to be stored. Optional.
 *     (Function) metaDataBuilder - Function which returns an object literal
 *                                  containing meta data to store along with
 *                                  the screenshot. Optional.
 *     (Boolean) takeScreenShotsForSkippedSpecs - Do you want to capture a
 *                                                screenshot for a skipped spec?
 *                                                Optional (default: false).
 */
function ScreenshotReporter(options) {
	options = options || {};

	if(!options.baseDirectory || options.baseDirectory.length === 0) {
		throw new Error('Please pass a valid base directory to store the ' +
			'screenshots into.');
	} else {
		this.baseDirectory = options.baseDirectory;
	}
	this.pathBuilder = options.useStructuredPath ? structuredPathBuilder : defaultPathBuilder;
	this.pathBuilder = options.pathBuilder || this.pathBuilder;
	this.metaDataBuilder = options.metaDataBuilder || defaultMetaDataBuilder;
	this.takeScreenShotsForSkippedSpecs =
		options.takeScreenShotsForSkippedSpecs || false;
	this.takeScreenShotsOnlyForFailedSpecs =
		options.takeScreenShotsOnlyForFailedSpecs || false;
}

/** Function: reportSpecResults
 * Called by Jasmine when reporteing results for a test spec. It triggers the
 * whole screenshot capture process and stores any relevant information.
 *
 * Parameters:
 *     (Object) spec - The test spec to report.
 */
ScreenshotReporter.prototype.specDone =
function reportSpecResults(results) {
	/* global browser */
	var self = this;
	if(!self.takeScreenShotsForSkippedSpecs && results.skipped) {
		return;
	}
	if(self.takeScreenShotsOnlyForFailedSpecs && !results.failedExpectation) {
		return;
	}
	browser.takeScreenshot().then(function (png) {
		browser.getCapabilities().then(function (capabilities) {
			var descriptions = util.gatherDescriptions(results, [])
				, baseName = self.pathBuilder(
					results
					, descriptions
					, results
					, capabilities
				)
				, metaData = self.metaDataBuilder(
					results
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
				, directory = path.dirname(screenShotPath);


			metaData.screenShotFile = screenShotFile;
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
