//var currentUrl = '';
class Gatherer {
  // constructor (debuggeeId, bar, modal, url) {
  constructor(debuggeeId) {
    this.debuggeeId= debuggeeId;
    this.target = {tabId: this.debuggeeId };
    //this.url = _url;
    //currentUrl = _url;
    this.modal = document.getElementById('myModal');
    this.bar = document.getElementById("myBar");
    this.waitTime = waitTime;
    console.log('this.debuggeeId');
    console.log(this.debuggeeId);
    // console.log('this.url');
    // console.log(this.url);

    this.TRACE_CATEGORIES = [
            '-*', // exclude default
            'toplevel',
            'v8.execute',
            'blink.console',
            'blink.user_timing',
            'benchmark',
            'loading',
            'latencyInfo',
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.frame',
            'disabled-by-default-devtools.timeline.stack',
            // Flipped off until bugs.chromium.org/p/v8/issues/detail?id=5820 is fixed in Stable
            // 'disabled-by-default-v8.cpu_profiler',
            // 'disabled-by-default-v8.cpu_profiler.hires',
            'disabled-by-default-devtools.screenshot',
          ];
  }

  async  traceGatherer() {
       this.modal.style.display = "block";
       //progressBar(this.bar, 1, 'Attached to debugger');
       // var target = {tabId: this._debuggeeId };
       // await chrome.debugger.attach(target, '1.1');
       var _device = document.getElementById("selectedDevice").value;
       var _networkSelected = document.getElementById("networkSelect").value;
       // console.log('_currentUrl before' +  _currentUrl );
       //window.setTimeout(function() {chrome.debugger.sendCommand(target, 'Page.navigate', {'url':'about:blank'})}, 300);
       // console.log('_currentUrl after 300' +  _currentUrl );
       try {
         if (_device =='mobile'){
           var mydevice = util.getDevice('GoogleNexus5');
           await chrome.debugger.sendCommand(this.target, "Page.setDeviceMetricsOverride",{
             width:              mydevice.width,
             height:             mydevice.height,
             deviceScaleFactor:  mydevice.deviceScaleFactor,
             mobile:             mydevice.mobile,
             fitWindow: false});
             console.log('Mobile');
           }
         await chrome.debugger.sendCommand(this.target, 'Network.enable');
         //progressBar(this.bar, 3, 'Network enabled');
         await chrome.debugger.sendCommand(this.target, 'Page.enable');
         //progressBar(this.bar, 5, 'Page enabled');
         if (_networkSelected != 'No_throttling' ){
           var _net = util.getNetConfig(_networkSelected);
           await chrome.debugger.sendCommand(this.target, 'Network.emulateNetworkConditions',
             {offline: false,
             latency: parseInt(_net.latency, 10),
             downloadThroughput: parseInt(_net.downloadRate, 10),
             uploadThroughput: parseInt(_net.uploadRate, 10)});
         }
         //chrome.debugger.sendCommand(target, 'Tracing.enable');
         console.log('Network.enable for: ' +  this.target.tabId );

         await chrome.debugger.sendCommand(this.target, "Tracing.start", {"categories":this.TRACE_CATEGORIES.join(',')});
         console.log('Tracing.start: ' +  this.target.tabId );
         progressBar(this.bar, 7, 'Trace started');

         // await chrome.debugger.sendCommand(this.target, 'Page.navigate', {'url':this.url, 'ignoreCache': true});
         await chrome.debugger.sendCommand(this.target, 'Page.reload', {'ignoreCache': true});
         console.log('Page.reload: ' +  this.target.tabId );
         await chrome.debugger.onEvent.addListener(onEvent);

       }
       catch(e) {
         console.log(e.message);
         }
   }
}

function onEvent(debuggeeId, message, params) {
 _bar = document.getElementById("myBar");
 if (message == 'Tracing.dataCollected'){
   var events = params.value;
   rawEvents = rawEvents.concat(events);
   progressBar(_bar, 45, 'Collecting trace...');

 }
 if (message == 'Tracing.tracingComplete'){
   var rawEventsString = rawEvents.map(function(e){
          return JSON.stringify(e);})
   //console.log(rawEvents);
   progressBar(_bar, 50, 'Analyzing trace...');
   chrome.debugger.onEvent.removeListener(onEvent);
   let _analyze = new Analyze();
   _analyze.analyzeTrace(rawEvents, _bar);

   // rawEvents = [];
   // rawEventsString = null;
   // chrome.debugger.detach(debuggeeId);
 }
 if (message == 'Page.loadEventFired' ){
   window.setTimeout(function() {
      chrome.debugger.sendCommand(debuggeeId, 'Tracing.end')
   }, parseInt(waitTime * 1000));
   //chrome.debugger.sendCommand(debuggeeId, 'Tracing.end');
 }
}
