var utils = require('./lib/util')
	, mkdirp = require('mkdirp')
	, join = require('path').join;

/** Class: ScreenshotReporter
 *
 * Parameters:
 *     (String) baseDirectory - The path to the directory where screenshots are
 *                              stored. If not existing, it gets created.
 */
function ScreenshotReporter(baseDirectory) {
	if(!baseDirectory || baseDirectory.length === 0) {
		throw new Error('Please pass a valid base directory to store the ' +
			'screenshots into.');
	}

	this.baseDirectory = baseDirectory;
}

/** Function: reportSpecResults
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
			var specDesciption = utils.gatherSpecDescription(spec.suite, spec.description)
				, results = spec.results()

				, baseName = utils.generateGuid()
				, screenShotFile = baseName + '.png'
				, metaFile = baseName + '.json'
				, screenShotPath = join(self.baseDirectory, screenShotFile)
				, metaPath = join(self.baseDirectory, metaFile);

			mkdirp(self.baseDirectory, function() {
				utils.storeScreenShot(png, screenShotPath);
				utils.storeMetaData(
					specDesciption
					, capabilities
					, results
					, screenShotFile
					, metaPath
				);
			});
		});
	});

};

module.exports = ScreenshotReporter;