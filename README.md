# WProfX-DevtoolsExtension

WProfX
=======================

WProfX captures and analyzes Chrome browsing traces in order to extract dependency relationship between activities. It is a continuation of works done before in [WProf] and [WProf-M] papers.

[WProf]: http://www3.cs.stonybrook.edu/~arunab/papers/wprof.pdf
[WProf-M]:http://www3.cs.stonybrook.edu/~arunab/papers/wprofm.pdf

Install
-----
Go to https://chrome.google.com/webstore/detail/wprofx/llogmgpdbcendfemmnebpdpdnadiakkg to add WProfX to your Chrome.
You can also follow these steps to load it in your Chrome browser: 

    1. Visit chrome://extensions (via omnibox or menu -> Tools -> Extensions).
    2. Enable Developer mode by ticking the checkbox in the upper-right corner.
    3. Click on the "Load unpacked extension..." button.
    4. Select the src/WProfX directory.


Compact mode
-----
Double click on any area in the chart to see a more compact version of the waterfall diagram.

Output JSON file
-----
The JSON output option downloads a `JSON` file which embodies all activities involved in a page load process. Moreover, it gives information about start and end time of activities and more interestingly the dependency relationship between such activities.

For each URL, a list of  entries carry information about all objects involved in processing that URL. Information include start/end times, mimeType and whether that each object has been called from a script or from the main HTML source.

```json
"url": "http://www.cnn.com/",
"startTime": 0.0,
"mimeType": "text/html",
"id": "31739.1",
"fromScript": "Null",
"transferSize": 4079,
"endTime": 125.068,
"activityId": "Networking_0",
"responseReceivedTime": 98.156,
"statusCode": 200
```

The entry with `"id": "Deps"` carries information regarding the dependency relationships between activities. 

For example, the following snippet states that  `Scripting_71` depends on `Networking_144` to be completed. Note that a `-1` as a value for `time` field, denotes a complete dependency relationship, i.e., `a1` needs to be finished before `a2` can start.

```json
{
	"time": -1,
	"a2": "Scripting_71",
	"a1": "Networking_144"
},
```

Whereas, a partial dependency in which, `time` value denotes the actual time in `milliseconds` when `a2` can start.

```json
{
    "time": 1003.723,
    "a2": "Networking_30",
    "a1": "Scripting_7"
}
```
