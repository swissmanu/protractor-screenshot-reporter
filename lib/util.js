var fs = require('fs')
	, path = require('path')
	, mkdirp = require('mkdirp')
	, crypto = require('crypto');

function storeScreenShot(data, file) {
	var stream = fs.createWriteStream(file);

	stream.write(new Buffer(data, 'base64'));
	stream.end();
}

function storeMetaData(description, capabilities, results, screenShotFile, file) {
	var metaData = {
			description: description
			, passed: results.passed()
			, os: capabilities.caps_.platform
			, browser: {
				name: capabilities.caps_.browserName
				, version: capabilities.caps_.version
			}
			, screenshot: screenShotFile
		}
		, result
		, json
		, stream;

	if(results.items_.length > 0) {
		result = results.items_[0];
		metaData.message = result.message;
		metaData.trace = result.trace.stack;
	}

	try {
		json = JSON.stringify(metaData);
		stream = fs.createWriteStream(file);

		stream.write(json);
		stream.end();
	} catch(e) {
		console.error('Could not save meta data for ' + screenShotFile);
	}
}

function gatherSpecDescription(suite, soFar) {
	var name = suite.description + ' ' + soFar;

	if(suite.parentSuite) {
		return gatherName(suite.parentSuite, name);
	} else {
		return name;
	}
}

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





module.export = {
	storeScreenShot: storeScreenShot
	, storeMetaData: storeMetaData
	, gatherSpecDescription: gatherSpecDescription
	, generateGuid: generateGuid
};