class Draw{
  constructor(data, merged){
    this.data= data;
    this.merged = merged
    /*
    1- Find row number where there is a critical path element on it.
    2- We do not collapse anything on these rows.
    3- Between critical path rows we draw all objects of similar types in one row.
    --similar types (javascripttypelist && scripting || HTML and loading) || CSS and parseAuthorStylesheet || images || other

    */
    this.cpRows = [];
    this.segmentRows = {};
    this.rowMapHash = {};
    this.rowByActivity = {};

    // document.getElementById('txt1').style.display = "none";
    // document.getElementById('txtLogo').style.display = "none";
    // document.getElementById('imgLogo').style.display = "none";
    document.getElementById("viewJson").disabled = false;
    captureBtn.removeEventListener('click', (event) => _main(event));
    var dl = document.getElementById('download_json');
    if (dl != null){
      dl.removeEventListener('click', (event) => util.jsonLink(event));
      dl.outerHTML="";
    }
    this.d_legacy = {}
    this.dataHash = {}
    this.javascript_type_list = new Set(['application/x-javascript', 'application/javascript', 'application/ecmascript', 'text/javascript', 'text/ecmascript', 'application/json', 'javascript/text']),
    this.css_type_list = new Set(['text/css', 'css/text']),
    this.text_type_list = new Set(['evalhtml', 'text/html', 'text/plain', 'text/xml']),
    this.colorMap = new Object({
            "ctext": "#2757ae",
            "dtext": "#a8c5f7",
            "cjs": "#c9780e",
            "djs": "#e8ae61",
            "ccss": "#13bd0d",
            "dcss": "#8ae887",
            "cother": "#eb5bc0",
            "dother": "#eb5bc0",
            "dfont": "#c415be",
            "dimg": "#c79efa",
            "render": "#9b82e3",
            "paint": "#76b169"
        });
    this.deps = [];
    this.critPath = [];
    this.merged = merged;
    this.orig_data = null;
    this.loadEventEnd = 0;

  }

  dataArrives() {
      var items = [];
      var timeBegin = 10000;
      var timeEnd = 0;
      // console.log('this.data');
      // console.log(this.data);
      this.data = JSON.parse(JSON.stringify(this.data));
      var _this = this;
      this.data.forEach(function (elem, index)  {
          if (index === _this.data.length - 1) {
              _this.critPath = elem.criticalPath;
              _this.d_legacy['firstMeaningfulPaint'] = elem.firstMeaningfulPaint;
              _this.d_legacy['firstContentfulPaint'] = elem.firstContentfulPaint;
              _this.d_legacy['firstPaint'] = elem.firstPaint;
              _this.loadEventEnd = elem.loadEventEnd;
              _this.d_legacy['domContentLoadedEventEnd'] = elem.domContentLoadedEventEnd;
              _this.d_legacy['timeToInteractive'] = elem.timeToInteractive;
              // d_legacy["computationTime"] = elem.computationTime;
              // d_legacy["networkingTime"] = elem.networkingTime;
              return;
          }
          //Uncomment when netlog/sockets, DNS are added
          //if (index === data.length - 2) return;
          elem.objs.forEach(function (objElem, objindex) {
              if (elem.id === "Deps") {
                  objElem.id = "Deps_" + objElem.a1;
                  // Store the dependencies for line drawing
                  _this.deps.push(objElem);
              } else {
                  objElem.info = "";
                  objElem.event = "";
                  objElem.type = "";
                  objElem.descr = util.formatobjInfo(objElem);
                  // console.log(objElem.desc);
                  //objElem.descr = JSON.stringify(util.omitKeys(objElem, ['info','event']));
                  if (objElem.activityId.split('_')[0] == "Networking") {
                      objElem.event = "download";
                      var mimeType = objElem.mimeType;
                      if (_this.javascript_type_list.has(mimeType)) {
                          objElem.color = _this.colorMap["djs"];
                          objElem.type = 'js';
                          //objElem.descr = "JS Download";
                      } else if (_this.text_type_list.has(mimeType)) {
                          objElem.color = _this.colorMap["dtext"];
                          objElem.type = 'html';
                          //objElem.descr = "Text Download";
                      } else if (_this.css_type_list.has(mimeType)) {
                          objElem.color = _this.colorMap["dcss"];
                          objElem.type = 'css';
                          //objElem.descr = "CSS Download";
                      } else if (mimeType.indexOf('/') !== -1 && mimeType.split('/')[0] === "image") {
                          objElem.color = _this.colorMap["dimg"];
                          objElem.type = 'image';
                          //objElem.descr = "Image Download";
                      } else if (mimeType.indexOf('/') !== -1) {
                          var _substr = mimeType.split('/');
                          if (_substr.length > 1 && _substr[1].indexOf('font') !== -1 ){
                            objElem.color = _this.colorMap["dfont"];
                            objElem.type = 'font';
                            //objElem.descr = "Font Download";
                          }
                          else {
                              objElem.color = _this.colorMap["dother"];
                              objElem.type = 'other';
                              //objElem.descr = "Other Download";
                            }
                      } else {
                          objElem.color = _this.colorMap["dother"];
                          objElem.type = 'other';
                          //objElem.descr = "Other Download";
                      }
                  } else if (objElem.activityId.split('_')[0] == "Loading") {
                      objElem.event = "";
                      if (objElem.name === "ParseHTML" && objElem.url !== undefined && objElem.url !== "") {
                          objElem.color = _this.colorMap["ctext"];
                          objElem.info = "evaljs";
                          objElem.type = 'html';
                          //objElem.descr = "Parse HTML";
                      } else if (objElem.name === "ParseAuthorStyleSheet" && objElem.styleSheetUrl != undefined &&
                          objElem.styleSheetUrl !== "") {
                          objElem.color = _this.colorMap["ccss"];
                          objElem.info = "evalcss";
                          //objElem.descr = "Parse CSS";
                          objElem.url = objElem.styleSheetUrl;
                          objElem.type = 'css';
                      }
                  } else if (objElem.activityId.split('_')[0] == "Scripting") {
                      objElem.event = "script";
                      objElem.color = _this.colorMap["cjs"];
                      objElem.type = 'js';
                      //objElem.descr = "Scripting";
                  } else if (objElem.activityId.split('_')[0] == "Rendering") {
                      objElem.event = "render";
                      objElem.color = _this.colorMap["render"];
                      //objElem.descr = "Rendering";
                  } else if (objElem.activityId.split('_')[0] == "Painting") {
                      objElem.event = "paint";
                      objElem.color = _this.colorMap["paint"];
                      //objElem.descr = "Painting";
                  }

                  // Create the Object
                  objElem.id = objElem.activityId;
                  objElem.activityId = elem.id + "##" + objElem.id;
                  timeBegin = Math.min(parseFloat(timeBegin), parseFloat(objElem.startTime));
                  timeEnd = Math.max(parseFloat(timeEnd), parseFloat(objElem.endTime));

                  // Used for bar merging
                  objElem.row = index;
                    if (!(index in _this.segmentRows)){
                      _this.segmentRows[index] = [objElem.activityId, objElem.type] ;
                    }
                    else {
                      _this.segmentRows[index].push([objElem.activityId, objElem.type]);
                    }
                  // Filler
                  objElem.start = objElem.startTime;
                  objElem.end = objElem.endTime;
                  objElem.same_group = "";
		              objElem.same_with = "";
                  objElem.prev = []; // Previous elems. for dependencies.
                  objElem.next = []; // Previous elems. for dependencies.
                  objElem.offset = 0;
                  objElem.len = objElem.endTime - objElem.startTime;

                  // Row Number
                  objElem.download_group = index;
                  // console.log('objElem.download_group = index');
                  // console.log(objElem);
                  // console.log(index);
                  // Merge Group: used for bar collapse
                  objElem.mergedRow = index;
                  objElem.domain = tld.getDomain(elem.id);
                  items.push(objElem);
              }
          });
        });

         /*
          * Populate the dataHash- stores the index of the actual data
          * datahash[id] = i, items[i] = data_obj
          */
          for(var i=0; i<items.length; i++) {
              this.dataHash[items[i].id] = i;
          }
          // console.log('items');
          // console.log(items);
          // console.log('this.datahash');
          // console.log(this.dataHash);
         /*
          * Fill out the previous and next elements using dependencies
          * Can be done in timeline.js but we need it for bar collapse
          */
          _this = this;
          this.deps.forEach(function(elem, index) {
              var a1_id = elem.a1;
              var a2_id = elem.a2;
              items[_this.dataHash[a1_id]].next.push(items[_this.dataHash[a2_id]]);
              items[_this.dataHash[a2_id]].prev.push(items[_this.dataHash[a1_id]]);
          });

          this.d_legacy["critPath"] = this.critPath;
          this.d_legacy["data"] = items;
          this.d_legacy["loadTime"] = timeEnd - timeBegin;
          // console.log('this.d_legacy["loadTime"]');
          // console.log(this.d_legacy["loadTime"]);
          // // Using loadEventEnd from trace
          this.d_legacy["onLoad"] = this.loadEventEnd;
          // //d_legacy["htmlSource"] = filename.split(".json")[0];
          // console.log('deps');
          // console.log(this.deps);
          // console.log('critPath');
          // console.log(this.critPath);
          this.d_legacy["deps"] = this.deps;
          this.d_legacy["dataHash"] = this.dataHash;
          this.d_legacy['segmentRows'] = this.segmentRows;

          //drawGraph(compress);
          // Check if anything failed
          // .fail(function() {
          //     // Error shown
          //     alert("Invalid or Currupted JSON.");
          //     // Go back to previous page
          //     window.history.back();
          // });
  }

  drawGraph() {
      var g = new svg(this.d_legacy, 'mySVG');
      g.draw(this.merged);
      //d3.select("#mySVG").transition() // Hori.
      //     .duration(800)
      //     .on('dblclick', g.mergeToggleHandler);
      var _mySVG = document.getElementById("mySVG");
      _mySVG.addEventListener('dblclick', (event) => g.mergeToggleHandler(event));


  }
}
