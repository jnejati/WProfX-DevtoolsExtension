function getConnectedTargets(){
  return new Promise(function(resolve, reject) {
    chrome.debugger.getTargets(function(targetArray){
      // console.log(targetArray);
      resolve(targetArray);
    });
  });
}
function detachAllDebuggers(targetArray){
  console.log(targetArray);
  return new Promise(function(resolve, reject) {
    var errors = '';
    console.log(targetArray);
    targetArray.forEach(function(_target){
      if (_target.attached && 'tabId' in _target){
         try{
           chrome.debugger.detach({tabId:_target.tabId}, function(){
             console.log('detaching: ' + _target.tabId);
              });
         }
         catch(e){
           errors = errors + ', ' + e;
          }
        }
      });
      resolve('errors');
   });
}

 function attachDebugger(debuggeeId) {
  return new Promise(function(resolve, reject) {
    var target = {tabId: debuggeeId };
    console.log(target);
    chrome.debugger.detach(target, function(){
      console.log('Detaching: ' + target.tabId);
      chrome.debugger.attach(target, '1.1', function(){
        //chrome.debugger.sendCommand(target, 'Page.reload');
        console.log('Attaching' + target.tabId);
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          reject('chrome.runtime.lastError.message');
        }
        resolve('OK');
      });
    });
  });
}

 function getUrl (){
   return new Promise(function(resolve, reject) {
       chrome.devtools.network.onNavigated.addListener(function (url){
         console.log(url);
       resolve(url);
     }, {once: true});
    });
 }

class Runner {
  constructor(debuggeeId){
    this.debuggeeId = debuggeeId;
    this.target = {tabId: this.debuggeeId };
    this.modal = document.getElementById('myModal');
    this.bar = document.getElementById("myBar");
    this.barTxt = document.getElementById("barTxt");
  }

   run(){
    //this.connection = new Connection(this.debuggeeId);
    var _this = this;
    // var p1 = getConnectedTargets().then(detachAllDebuggers)
    // .catch(err => util.displayError(err));
    //var p2 = p1.then(attachDebugger(this.debuggeeId));
    var p2 = attachDebugger(this.debuggeeId);

    // var p3 = p2.then(function(){
    //   chrome.devtools.network.onNavigated.addListener(function (url){
    //     console.log(url);
    // }, {once: true});
    // });

    p2.then(function() {
        _this.gatherer = new Gatherer(_this.debuggeeId, _this.bar, _this.modal);
        _this.gatherer.traceGatherer();
      })
    .catch(err => util.displayError(err));
 }

  clean(){
    var legendDiv = document.getElementById("legendDiv");
    var svgDiv = document.getElementById("parent");
    if (svgDiv!== null){
      svgDiv.outerHTML = "";
      var newDiv = document.createElement("div");
      newDiv.id="parent";
      var newSvgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      newSvgNode.id = 'mySVG';
      newSvgNode.setAttribute('class', 'svg-container');
      newDiv.appendChild(newSvgNode);
      util.insertAfter(newDiv, legendDiv);
     //  var mysvg = d3.select("#mySVG")
     //  .call(d3.zoom().on("zoom", function () {
     //    mysvg.attr("transform", d3.event.transform)
     //  }))
     // .append("g")
     }
  }
}

rawEvents = [];
rawEventsString = null;
countEl = document.getElementById("count");
waitTime = 0;
var _close = document.getElementsByClassName("close")[0];
var modal = document.getElementById('myModal');
// var bar = document.getElementById("myBar");
var barTxt = document.getElementById("barTxt");

function progressBar(_bar, percentage, txt){
  _bar.style.width = percentage + '%';
  barTxt.innerHTML=txt;
}

function  plus(){
    if (waitTime < 10){
      waitTime++;
      countEl.value = waitTime;
    }
  }

function minus(){
    if (waitTime > 0) {
      waitTime--;
      countEl.value = waitTime;
    }
  }

var _plus = document.getElementById("plus");
var _minus = document.getElementById("minus");

// _close.onclick = function() {
//    modal.style.display = "none";
//  }
 _close.addEventListener('click', function(){modal.style.display = "none";});
 _plus.addEventListener('click', plus);
 _minus.addEventListener('click', minus);


//document.addEventListener('DOMContentLoaded', attachDebugger);
var captureBtn = document.getElementById("capture");
captureBtn.addEventListener('click', (event) => _main(event));
function _main(event){
  rawEvents = [];
  rawEventsString = null;
  var _debuggeeId = chrome.devtools.inspectedWindow.tabId;
  const runner = new Runner(_debuggeeId);
  runner.clean();
  runner.run();
}
