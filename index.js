var util = require('./lib/util')
	, mkdirp = require('mkdirp')
	, path = require('path')
	, q = require('q');

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
 *     (Integer) index - When taking more than one screenshot per spec, this
 *                       index represents the number of this screenshot.
 *
 * Returns:
 *     (String) containing the built path
 */
function defaultPathBuilder(spec, descriptions, results, capabilities, index) {
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
	return {
		description: descriptions.reverse().join(' ')
		, passed: results.passed()
		, os: capabilities.caps_.platform
		, browser: {
			name: capabilities.caps_.browserName
			, version: capabilities.caps_.version
		}
		, screenShots: spec.screenShotFiles
	};
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

	this.pathBuilder = options.pathBuilder || defaultPathBuilder;
	this.metaDataBuilder = options.metaDataBuilder || defaultMetaDataBuilder;
	this.takeScreenShotsForSkippedSpecs =
		options.takeScreenShotsForSkippedSpecs || false;
	this.takeScreenShotsOnlyForFailedSpecs =
		options.takeScreenShotsOnlyForFailedSpecs || false;

	var self = this;


	// takes screenshot on each failed expect
	var originalAddMatcherResult = jasmine.Spec.prototype.addMatcherResult;
	jasmine.Spec.prototype.addMatcherResult = function() {
		if (!arguments[0].passed()) {
			self.takeScreenshot(this, arguments[0]);
		}
		return originalAddMatcherResult.apply(this, arguments);
	};

	// manual screenshots
	jasmine.Spec.prototype.takeScreenshot = function takeScreenshot(label) {
		self.takeScreenshot(this, {
			message: 'Manual Screenshot: ' + (label || 'unnamed')
		});
	};
}

ScreenshotReporter.prototype.takeScreenshot = function takeScreenshot(spec, results) {
	var self = this;

	return browser.takeScreenshot()
	.then(function(png) {

		if(!self.capabilities) {
			return browser.getCapabilities()
			.then(function(capabilities) {
				self.capabilities = capabilities;
				self.saveScreenshot(spec, results, capabilities, png);
			});
		} else {
			return q.when(self.saveScreenshot(spec, results, self.capabilities, png));
		}
	});
};

ScreenshotReporter.prototype.saveScreenshot = function saveScreenshot(spec, results, capabilities, png) {
	var descriptions = util.gatherDescriptions(
			spec.suite
			, [spec.description]
		)

		, baseName = this.pathBuilder(
			spec
			, descriptions
			, results
			, this.capabilities
			, spec.screenShotFiles ? spec.screenShotFiles.length : 0
		)

		, screenShotFile = baseName + '.png'
		, screenShotPath = path.join(this.baseDirectory, screenShotFile)

		// pathBuilder can return a subfoldered path too. So extract the
		// directory path without the baseName
		, directory = path.dirname(screenShotPath);


	if(!Array.isArray(spec.screenShotFiles)) {
		spec.screenShotFiles = [];
	}

	spec.screenShotFiles.push({
		file: screenShotFile
		, results: results
	});

	mkdirp(directory, function(err) {
		if(err) {
			throw new Error('Could not create directory ' + directory);
		} else {
			util.storeScreenShot(png, screenShotPath);
		}
	});
};

/** Function: reportSpecResults
 * Called by Jasmine when reporteing results for a test spec. It triggers the
 * whole screenshot capture process and stores any relevant information.
 *
 * Parameters:
 *     (Object) spec - The test spec to report.
 */
ScreenshotReporter.prototype.reportSpecResults =
function reportSpecResults(spec) {
	var results = spec.results()
		, self = this;

	if(!this.takeScreenShotsForSkippedSpecs && results.skipped) {
		return;
	}
	if(this.takeScreenShotsOnlyForFailedSpecs && results.passed()) {
		return;
	}

	this.takeScreenshot(spec, results.items_)
	.then(function() {
		var descriptions = util.gatherDescriptions(
				spec.suite
				, [spec.description]
			);

		var metaData = self.metaDataBuilder(
				spec
				, descriptions
				, results
				, self.capabilities
			)
		, metaFile = util.generateGuid() + '.json'
		, metaDataPath = path.join(self.baseDirectory, metaFile);

		util.storeMetaData(metaData, metaDataPath);
	});
};

module.exports = ScreenshotReporter;
