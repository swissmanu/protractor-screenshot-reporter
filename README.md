# Screenshot Reporter for Protractor
Running functional E2E tests using [Protractor](https://github.com/angular/protractor) is nice. Executing them on a remote and/or virtualized [Selenium](http://docs.seleniumhq.org/) Grid improves the productivity even more.
But at least when a test case fails, you may become curious about the actual rendered output of the browser which runned the test.

The `protractor-screenshot-reporter` creates a screenshot for each executed test. Along with a JSON file containining the test outcome, it gets saved on the machine which runs Protractor.

This allows a deeper analysis of what happend during a failed test.


## Usage
The `protractor-screenshot-reporter` is available via npm:

```bash
$ npm install protractor-screenshot-reporter --save-dev
```

In your Protractor configuration file, register `protractor-screenshot-reporter` in Jasmine:

```javascript
var ScreenShotReporter = require('protractor-screenshot-reporter');

exports.config = {

	// your config here ...

	onPrepare: function() {
		// Add a screenshot reporter and store screenshots into
		// `./test/screenshots`:
		jasmine.getEnv().addReporter(new ScreenShotReporter('./test/screenshots'));
	}
}
```

## Configuration
### Target directory
You have to pass a directory path as parameter when creating a new instance of
the screenshot reporter:

```javascript
var reporter = new ScreenShotReporter('/store/screenshots/here');
```

If the given directory does not exists, it is created automatically as soon as a screenshot needs to be stored.


## Preprocessing
A screenshot is saved as PNG image using a generated [GUID](http://de.wikipedia.org/wiki/Globally_Unique_Identifier) as filename. Along with the image, a JSON file with a matching filename is created.

The JSON file contains the test outcome and further information about the Selenium machine which executed the test case:

```json
{
   "description":"index.html header should fail",
   "passed":false,
   "os":"LINUX",
   "browser":{
      "name":"firefox",
      "version":"26.0"
   },
   "screenshot":"004200db-0032-005a-00f3-0072008c001c.png",
   "message":"TypeError: Cannot read property 'be' of undefined",
   "trace":"TypeError: Cannot read property 'be' of undefined\n    at null.<anonymous> etc."
}
```
By parsing these JSON files in a preprocessing step, you can generate a human readable test report.

*Preprocessing is not a functionality of `protractor-screenshot-reporter`. Use [Grunt](http://gruntjs.com) or similar tools to integrate it into your test process.*


## License
Copyright (c) 2014 Manuel Alabor <manuel@alabor.me>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
