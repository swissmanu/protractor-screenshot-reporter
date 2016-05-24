var fs = require('fs')
	, path = require('path')
	, mkdirp = require('mkdirp')
	, crypto = require('crypto');

/** Function: storeScreenShot
 * Stores base64 encoded PNG data to the file at the given path.
 *
 * Parameters:
 *     (String) data - PNG data, encoded in base64
 *     (String) file - Target file path
 */
function storeScreenShot(data, file) {
	var stream = fs.createWriteStream(file);

	stream.write(new Buffer(data, 'base64'));
	stream.end();
}

/** Function: storeMetaData
 * Converts the metaData object to a JSON string and stores it to the file at
 * the given path.
 *
 * Parameters:
 *     (Object) metaData - Object to save as JSON
 *     (String) file - Target file path
 */
function storeMetaData(metaData, file) {
	var json
		, stream;

	try {
		json = JSON.stringify(metaData,null,'\t');
		stream = fs.createWriteStream(file);

		stream.write(json);
		stream.end();
	} catch(e) {
		console.error('Could not save meta data for ' + screenShotFile);
	}
}

/** Function: gatherDescriptions
 * Traverses the parent suites of a test spec recursivly and gathers all
 * descriptions. Finally returns them as an array.
 *
 * Example:
 * If your test file has the following structure, this function returns an
 * array like ['My Tests', 'Module 1', 'Case A'] when executed for `Case A`:
 *
 *     describe('My Tests', function() {
 *         describe('Module 1', function() {
 *             it('Case A', function() { /* ... * / });
 *         });
 *     });
 *
 * Parameters:
 *     (Object) suite - Test suite
 *     (Array) soFar - Already gathered descriptions. On first call, pass an
 *                     array containing the specs description itself.
 *
 * Returns:
 *     (Array) containing the descriptions of all parental suites and the suite
 *             itself.
 */
function gatherDescriptions(suite, soFar) {
	soFar.push(suite.description);

	if(suite.parentSuite) {
		return gatherDescriptions(suite.parentSuite, soFar);
	} else {
		return soFar;
	}
}

/** Function: generateGuid
 * Generates a GUID using node.js' crypto module.
 *
 * Returns:
 *     (String) containing a guid
 */
function generateGuid() {
    var buf = new Uint16Array(8);
    buf = crypto.randomBytes(8);
    var S4 = function(num) {
            var ret = num.toString(16);
            while(ret.length < 4){
                    ret = "0"+ret;
            }
            return ret;
    };

    return (
            S4(buf[0])+S4(buf[1])+"-"+S4(buf[2])+"-"+S4(buf[3])+"-"+
            S4(buf[4])+"-"+S4(buf[5])+S4(buf[6])+S4(buf[7])
    );
}

/** Function: extend
 * Performs a shallow copy of all props of `obj` onto `dupe`
 *
 * Returns:
 *     (Object) containing a shallow copy
 */
function extend(dupe, obj) { //
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			dupe[prop] = obj[prop];
		}
	}
	return dupe;
}

module.exports = {
	storeScreenShot: storeScreenShot
	, storeMetaData: storeMetaData
	, gatherDescriptions: gatherDescriptions
	, generateGuid: generateGuid
	, extend: extend
};
