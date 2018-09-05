/*
 * Utility functions
 */

// Initialize util object
var util = {};

// The palette that defines the color of blocks
util.paletteBlock = {
  "": "9999dd",
  "h": "bbbbff",
  "none": "fff",
  "depended": "eee",
  "download": "EB5BC0",
  "download_h": "EB5BC0",
  "download_image": "c79efa",
  "download_image_h": "c79efa",
  "download_javascript": "E8AE61",
  "download_javascript_h": "E8AE61",
  "download_css": "8AE887",
  "download_css_h": "8AE887",
  "download_html": "A8C5F7",
  "download_html_h": "A8C5F7",
  "parse": "cd5c5c",
  "parse_h": "dd6c6c",
  "execute": "8a2be2",
  "execute_h": "9a3bf2",
  "evaljs": "C9780E",
  "evalcss": "13BD0D",
  "evalhtml": "2758B0",
  "null": "D93038",
};

// The palette that defines the color of lines
util.paletteLine = {
  "": "000000",
  "h": "555555",
  "axis": "bbb",
  "loadTime": "f00",
  "to": "FFA500",
  "from": "87CEEB",
};

/*
 * Gets the color of each block depends on the type and infro are given.
 * @param type - the type of the block have
 * @param info -  the information about the block
 * @return the color of the block
 */
util.getBlockColor = function(type, info) {
  if (type == "download"){
	var a = info.split(":");
	if (a[0] == "image" || a[0] == "javascript" || a[0] == "css" || a[0] == "html")
		type += "_" + a[0];
	if (a[1] == "javascript")
		type += "_" + a[1];
	return util.paletteBlock[type];
  }else{
	return util.paletteBlock[info];
  }
};

/*
 * Gets the color of each line with given type
 * @param type - the type of the line
 * @return the color of the line
 */
util.getLineColor = function(type) {
  return util.paletteLine[type];
};

/*
 * Get KB from ginve bytes
 * @param bytes - KB needs to convert
 * @param n - number of decimal are needed
 * @return the bytes representation of KB
 */
util.getKBfromBytes = function(bytes, n) {
  m = 1;
  for (var i = 0; i < n; ++i)
    m *= 10;
  return Math.round(bytes / 1024 * m) / m;
};

/*
 * Converts a from a decimal number into a percentage number
 * @param a - number that needs to convert to percentage
 * @param n - number of decimal are needed
 * @return the percentage representation
 */
util.getPercentage = function(a, n) {
  m = 1;
  for (var i = 0; i < n; ++i)
    m *= 10;
  return Math.round(a * 100 * m) / m;
};

/*
 * Get the particular length of the url
 * @param url - the url needs to be trimed
 * @param allowed_strlen - the maximum length of url
 * @return the trimed url
 */
util.trimUrl = function(url, allowed_strlen) {
  if (!url)
    return "";
  if (url.length <= allowed_strlen)
    return url;

  var n = url.length;
  return url.substring(0, canvas.allowedStrLen - 13) + "..." + url.substring(n - 10, n);
};

/*
 * Get the domain in the url if there is a domain
 * @param url - the url needs to be modified
 * @return the domain of the url
 */
util.domain = function(url) {
  var a = url.split("/");
  if (a.length > 2)
    return a[2];
  return url;
};

/*
 * Gets the parameter in the url if there is a parameter
 * @param url - the url that need to be checked
 * @return the parameter of the url if there is one
 * @return empty string of there is no parameter
 */
util.param = function(url) {
  var a = url.split("?");
  if (a.length > 1)
    return "param";
  return "";
};

/*
 * Returns a message giving the estimate time to analyze the file
 * @param fileSize - the size of the file to be analyzed
 * @return a message giving the estimate time in minutes, accurate to
 *  0.5 minutes for small sizes, and no message for times close to 0.
 */
util.estimateTime = function(fileSize) {
  var size = parseInt(fileSize);
  if (size < 0)
    return "Error!<br/>Cannot estimate analysis time.";
  else if (size < 400)
    return "";
  else {
    // (6*10^-5)x^2 + 0.0256x - 6.6881
    var time = (6 * Math.pow(10, -5) * Math.pow(size, 2)) + (0.0256 * size) - 6.6881;
    var est = 0;
    if (size < 2500)
      est = (Math.round(time / 30) + 1) / 2;
    else
      est = Math.round(time / 60) + 1;
    return "Est. time:<br>" + est + " min<br>Check back then!";
  }
};

/*
 * Shows/hides the live search results for the given search string
 * @param str - the search string to find matching graphs with
 */
util.search = function(str) {
  if (str.length==0) {
    document.getElementById("livesearch").style.display="none";
    return;
  }
  if (window.XMLHttpRequest) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  } else {
    // code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      document.getElementById("livesearch").style.display="inline-block";
      document.getElementById("livesearch").innerHTML="<ul>"+this.responseText+"</ul>";
    }
  }
  xmlhttp.open("GET","../php/livesearch.php?s="+str,true);
  xmlhttp.send();
};

util.legendHandler=function (){

  var referenceNode = document.getElementById('txt1');
  if (referenceNode == null){
    referenceNode = document.getElementById('myModal');
  }
  var legendDiv = document.getElementById("legendDiv");
  if (legendDiv!== null){
    legendDiv.outerHTML = "";
    var newLegendDiv = document.createElement("div");
    newLegendDiv.id="legendDiv";
    newLegendDiv.setAttribute('class', 'legend-wrapper');

    var newActivityLegend = document.createElement("div");
    newActivityLegend.id = 'legend';
    newLegendDiv.appendChild(newActivityLegend);

    var newAMetricLegend = document.createElement("div");
    newAMetricLegend.id = 'metricLegend';
    newLegendDiv.appendChild(newAMetricLegend);
    util.insertAfter(newLegendDiv, referenceNode);
  }
   legend(d3.select("#legend"));
   metricLegend(d3.select("#metricLegend"));
 };


// util.criticalPathHandler=function (){
//   console.log('criticalPathHandler');
//   var cb1 = document.getElementById("ui-checkbox-label1");
//   console.log(cb1);
//
//   cb1.addEventListener('click', function(){
//     svg.getRegisteredcanvas('mySVG').toggleCriticalPath();
//
// });
// };
//
// util.depLineHandler=function (){
//   var cb2 = document.getElementById("ui-checkbox-label2");
//   cb2.addEventListener('click', function(){
//     svg.getRegisteredcanvas('mySVG').showAllLines();
// });
// };

util.downloadHandler=function(myObj, url){
  console.log('In downloadHandler: ' + url );
  var fileName = tld.getDomain(url);
  fileName = fileName.concat('.json');
  var dl = document.getElementById("viewJson");
  dl.addEventListener('click', (event) =>  util.jsonLink(event, myObj, fileName));
};

util.jsonLink=function(event, myObj, fileName){
  util.downloadTextFile(JSON.stringify(myObj), fileName);
}

util.downloadTextFile=function(text, name) {
    const a = document.createElement('a');
    a.id = 'download_json';
    const type = name.split(".").pop();
    a.href = URL.createObjectURL( new Blob([text], { type:`text/${type === "txt" ? "plain" : type}` }) );
    a.download = name;
    a.click();
  };

util.getDevice = function (_name){
  var _device_array = [
    {title: "Google Nexus 5", width: 360, height: 640, deviceScaleFactor: 3, userAgent: "Mozilla/5.0 (Linux; Android 4.4.4; en-us; Nexus 5 Build/JOP40D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2307.2 Mobile Safari/537.36", touch: true, mobile: true},
  ];
   var devices = {};
  _device_array.forEach(function(_device){
      devices[_device.title.replace(/\s+/gi,'')] = _device;
  });
  return devices[_name];
};


util.getNetConfig = function (_name){
  var netConfig = {'GPRS':{'latency' : 500, 'downloadRate':50000, 'uploadRate': 20000},
      'Regular_2G':{'latency' : 300, 'downloadRate':250000, 'uploadRate': 50000},
      'Good_2G':{'latency' : 150, 'downloadRate':450000, 'uploadRate': 150000},
      'Regular_3G':{'latency' : 100, 'downloadRate':750000, 'uploadRate': 250000},
      'Good_3G':{'latency' : 40, 'downloadRate':1500000, 'uploadRate': 750000},
      'Regular_4G':{'latency' : 20, 'downloadRate':4000000, 'uploadRate': 3000000},
      'DSL':{'latency' : 5, 'downloadRate':2000000, 'uploadRate': 1000000},
      'WiFi':{'latency' : 2, 'downloadRate':30000000, 'uploadRate': 15000000}
    };
  return netConfig[_name];
};

util.responsivefy =function () {
  var _svg = d3.select('#mySVG')
  // console.log('_svg');
  // console.log(_svg);

  // var _svg = document.getElementById('mySVG');
  // var bBox = _svg.getBBox();
  // console.log('XxY', bBox.x + 'x' + bBox.y);
  // console.log('size: ', bBox.width + 'x: ' + bBox.height);
  var container = d3.select('#parent');
  _width = parseInt(container.style("width")),
  _height = parseInt(container.style("height")),
  _aspect = _width / _height;
  console.log('width, height, aspect');
  console.log(_width, _height, _aspect);
  console.log('svg_width, svg_height, svg_aspect');

  _w = _svg.property("viewBox").baseVal.width;
  _h = _svg.property("viewBox").baseVal.height;
  _a = _w/_h;
  console.log('SVG _w, _h, _a');
  console.log(_w, _h, _a);

  // add viewBox and preserveAspectRatio properties,
  // and call resize so that svg resizes on inital page load


  // to register multiple listeners for same event type,
  // you need to add namespace, i.e., 'click.foo'
  // necessary if you call invoke this function for multiple svgs
  // api docs: https://github.com/mbostock/d3/wiki/Selections#on
  d3.select(window).on("resize." + container.attr("id"), resize);

  // get width of container and resize svg to fit it
  util.resize=function () {
      var targetWidth = parseInt(container.style("width"));
      var targetHeight = Math.round(targetWidth / _aspect);
      console.log('targetWidth');
      console.log(targetWidth + 'height: ' + targetHeight);
      _svg.attr("width", targetWidth);
      _svg.attr("height", targetHeight);
      _svg.attr("viewBox", "0 0 " + targetWidth + " " + targetHeight);
      _svg.attr("preserveAspectRatio", "xMinYMid meet");

  }
}

util.omitKeys = function(obj, keys){
    var dup = {};
    for (var key in obj) {
        if (keys.indexOf(key) == -1) {
            dup[key] = obj[key];
        }
    }
    return dup;
}
util.smartTrim=function(string, maxLength) {
    if (!string) return string;
    if (maxLength < 1) return string;
    if (string.length <= maxLength) return string;
    if (maxLength == 1) return string.substring(0,1) + '...';

    var midpoint = Math.ceil(string.length / 2);
    var toremove = string.length - maxLength;
    var lstrip = Math.ceil(toremove/2);
    var rstrip = toremove - lstrip;
    return string.substring(0, midpoint-lstrip) + '...'
    + string.substring(midpoint+rstrip);
}

util.formatobjInfo=function(_elem){
  var _url=null;
  var _fromScript = null
  var _activity_id = null;
  var _startTime=null;
  var _endTime= null;
  var _desc = '';
  var _mimeType = '';
  var _size = '';

  if ('url' in _elem){
    _url = _elem.url;
  }
  _url = util.smartTrim(_url, 100);
  if ('fromScript' in _elem){
    _fromScript = _elem.fromScript;
  }
  _fromScript = util.smartTrim(_fromScript, 100);
  _activity_id = _elem.activityId;
  _startTime = _elem.startTime;
  _endTime = _elem.endTime;

  if (_activity_id.split('_')[0] == "Networking"){
    _mimeType = _elem.mimeType;
    _size = _elem.transferSize;
    _desc = '<span class="jsonId"> Id: ' + '<span class="jsonString"> ' + _activity_id +  '</span>' +
            ', <span class="jsonId"> mimeType: ' + '<span class="jsonString"> ' + _mimeType +  '</span>' +
            ', <span class="jsonId"> transferSize: ' + '<span class="jsonNumber"> ' + _size + '</span>' +
            ', <span class="jsonId"> fromScript: ' + '<span class="jsonString"> ' + _fromScript + '</span>' +
            '<br> <span class="jsonId"> startTime: ' + '<span class="jsonNumber"> ' + _startTime +  '(ms)</span>' +
            ', <span class="jsonId"> endTime: ' + '<span class="jsonNumber"> ' + _endTime +  '(ms)</span>' +
            ', <span class="jsonId"> URL: ' + '<span class="jsonString"> ' + _url +  '</span>' ;
  }
  else{
    _desc = '<span class="jsonId"> Id: ' + '<span class="jsonString"> ' + _activity_id +  '</span>' +
            ', <span class="jsonId"> fromScript: ' + '<span class="jsonString"> ' + _fromScript + '</span>' +
            '<br> <span class="jsonId"> startTime: ' + '<span class="jsonNumber"> ' + _startTime +  '(ms)</span>' +
            ', <span class="jsonId"> endTime: ' + '<span class="jsonNumber"> ' + _endTime +  '(ms)</span>' +
            ', <span class="jsonId"> URL: ' + '<span class="jsonString"> ' + _url +  '</span>' ;
  }
  return _desc;
}


util.InitForRerun=function(){
  var InPageBtn = document.getElementById("captureDiv");
  if (InPageBtn!== null){
    InPageBtn.outerHTML = "";
   }
  var elementExists = document.getElementById("reRun");
  if (elementExists == null){
    util.reRunElements();
   }
}

util.insertAfter=function(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

util.reRunElements=function(){
  var div = document.createElement("div");
  div.id = "reRun";
  div.setAttribute('class', 'tabbed-pane-right-toolbar toolbar');
  var button = document.createElement("button");
  button.id='capture';
  button.setAttribute('class','toolbar-button  btn-rerun');
  button.setAttribute('title','Run WProfX');
  var txtNode = document.createTextNode("Run WProfX");
  button.appendChild(txtNode);
  div.appendChild(button);
  document.getElementById("mainToolbar").appendChild(div);
  var captureBtn = document.getElementById("capture");
  captureBtn.addEventListener('click', (event) => _main(event));

}
util.round=function(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}
util.timeout=function(duration) { // Thanks joews
  return new Promise(function(resolve) {
    setTimeout(resolve, duration);
  });
}

util.displayError=function(err){
  //alert(err);
  console.log(err);
}
