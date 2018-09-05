// CONSTANTS
var margin = {
    top: 15,
    right: 20,
    bottom: 20,
    left: 20
};

// var barHeight = 12;
// var barSpace = 12; // Vertical space between bars
// var barCurve = 5; // Radius curve at bar corners
// var minBar = 7; // minimum bar length on hover
// var ttime = 800; // duration for movement transitions

var barHeight = 8;
var barSpace = 6; // Vertical space between bars
var barCurve = 3; // Radius curve at bar corners
var minBar = 7; // minimum bar length on hover
var ttime = 800; // duration for movement transitions
// var mergedToggle = true;

// Global variables
var w = 1000; // default width--code should overwrite
var h = 1000; // default height--code should overwrite
var max = 1; // Maximum number of rows - not yet set
var xScale; // Converts from time (ms?) to pixels
var yScale; // Converts from row number to pixels
var critPath = []; // bars and lines on the critical path
var oCritPath;
//var critOn = false; // critical path visibility
//var allVisible = false; // all dependency lines visibility
var edit = false; // detail edit mode status
//var htmlTxt = "";
var jsdeps = []; // asynchronized javascript dependencies
var dataHash = {};
var deps = [];
var dataset = [];
var ads_toggle = false;
var ad_objects = new Set(); // Set to store the objects to remove
var ad_domains = new Set(); // Set of domain names to query from
var orig_dataset = {};
var first = true;


/*
 * Function to register the SVG
 * id- ID of the SVG
 * d- data
 */
function svg(d, id) {
    // Register canvas
    orig_dataset = d;
    svg.registercanvas(id, this);
    this.dataset = d["data"];
    this.deps = d["deps"];
    this.dataHash = d["dataHash"];
    this.critPath = d["critPath"];
    if (this.critPath){
      this.download0Id = this.critPath[0];
    }
    this.segmentRows = d['segmentRows'];
    this.rowMapHash = {};
    this.mappedMaxRow = 0;
    critPath = this.critPath;

    this.loadTime = d["loadTime"];
    this.onLoad = d["onLoad"];
    this.firstMeaningfulPaint = d["firstMeaningfulPaint"];
    this.firstContentfulPaint = d["firstContentfulPaint"];
    this.firstPaint = d["firstPaint"];
    this.domContentLoadedEventEnd = d["domContentLoadedEventEnd"];
    this.timeToInteractive = d["timeToInteractive"];
    // this.computationTime = d["computationTime"];
    // this.networkingTime = d["networkingTime"];
    // this.onLoad = 10000;
    // this.firstMeaningfulPaint = 2000;
    // this.firstContentfulPaint = 4000;
    // this.firstPaint = 1500;
    // this.domContentLoadedEventEnd = 5000;
    // this.computationTime = 2000;
    // this.networkingTime = 8000;
    //this.htmlSource = d["htmlSource"] + ".html";
    this.svgId = id;
    this.svg = document.getElementById(id);

    // max : total number of rows : last row's download_group
    max = this.dataset[this.dataset.length - 1].download_group;

    // Width: Window width
    w = parseInt(d3.select("#parent").style("width"), 10) - margin.left - margin.right;
    // console.log('w: ' + w);
    // console.log('max: ' + max);
    // Height: maximum number of rows * space per bar
    h = max * (barHeight + barSpace);
    // console.log('    h = max * (barHeight + barSpace)' + h + ', ' +  max + ', ' +  barHeight + ', ' + barSpace);
    xScale = d3.scaleLinear()
        .domain([0, this.loadTime])
        .range([0, w]);
    yScale = d3.scaleLinear()
        .domain([0, max])
        .range([0, h]);
    yScaleMapped = null;
}


// The hashmap of registered canvas
// Key: id, value: svg object
svg.__registeredCanvases = {};

/*
 * Register canvas
 *
 * @param id: the id of the svg
 * @param g: the svg object
 */
svg.registercanvas = function(id, g) {
    svg.__registeredCanvases[id] = g;
}

/*
 * Get a registered canvas
 *
 * @param id: the id of the svg
 * @return: the svg object
 */
svg.getRegisteredcanvas = function(id) {
    return svg.__registeredCanvases[id];
}

svg.prototype = {

    /*  Sets the svg dimensions, plus margins
    	transitions smoothly when bars are expanded/condensed	*/
    init: function() {
      var __svg = d3.select(this.svg);
      var __container = d3.select("#parent");

      console.log("width: " +  w + ", " +  margin.left + ", " + margin.right);
      console.log("height: " +  yScale(max + 1) + ", " + margin.top + ", " + margin.bottom);
      __svg.transition().duration(ttime)
            .attr("width", w + margin.top + margin.bottom)
            .attr("height", yScale(max + 1) + margin.top + margin.bottom);
      __container.transition().duration(ttime)
            .attr("width", w + margin.top + margin.bottom)
            .attr("height", yScale(max + 1) + margin.top + margin.bottom);
      var __w = w;
      var __h = yScale(max + 1);
      responsivefy(__svg, __w, __h);

      function responsivefy(_svg, _w, _h) {
        // get container + _svg aspect ratio
        var _container = d3.select(_svg.node().parentNode);
        // var dimensions = _container.node().getBoundingClientRect();
        // var _width = parseInt(dimensions.width);
        // var _height = parseInt(dimensions.height);
        var _aspect = _w /_h;
        // console.log('_container');
        // console.log(_container);
        // console.log('_width');
        // console.log(_w);
        // console.log('_height');
        // console.log(_h);

        // add viewBox and preserveAspectRatio properties,
        // and call resize so that _svg resizes on inital page load
        var cur_w = _w + margin.left + margin.right;
        var cur_h = _h + margin.top + margin.bottom;
        _svg.attr("viewBox", "0 0 " + cur_w  + " " + cur_h)
            .attr("perserveAspectRatio", "xMinYMid")
            .call(resize);

        // to register multiple listeners for same event type,
        // you need to add namespace, i.e., 'click.foo'
        // necessary if you call invoke this function for multiple _svgs
        // api docs: https://github.com/mbostock/d3/wiki/Selections#on
        d3.select(window).on("resize." + _container.attr("id"), resize);

        // get width of container and resize _svg to fit it
        function resize() {
            var _targetWidth = parseInt(_container.style("width"));
            _svg.attr("width", _targetWidth);
            _svg.attr("height", Math.round(_targetWidth / _aspect));
        }
      }
    },

    /* 	draws bars and sets hover/click event functions			*/
    _drawBars: function(mergedToggle) {
        var me = this; // this: the svg
        var hiddenBars = 0; // count of merged bars
        var dragging = false;
        var me = this;
        // Draw and color rectangles

        d3.select("#graph").selectAll(".normal-rect")
            .data(me.dataset)
            .enter()
            .append("g")
            .attr("class", "normal-rect")
            .attr("transform", function(d, i) {
                return "translate(" + xScale(d.start) + "," + (yScale(me.getRowNumber(d.download_group, d.id, mergedToggle)) + margin.top) + ")";
            })
            .append("rect")
            .attr("id", function(d) {
                return d.id;
            })
            .attr("class", "bars")
            .attr("width", function(d) {
                // set initial offset to 0 (see _miniExpand)
                d['offset'] = 0;
                return xScale(d.end - d.start);
            })
            .attr("height", barHeight)
            .attr("fill", function(d) {
                return d.color;
            })
            .attr("rx", barCurve)
            .attr("ry", barCurve);

        /*  Set rectangles in the same group to be transparent
        	Mark the top rectangle in each group with "+"		*/
        var last = "";
        var download0Id = this.download0Id;
        // d3.select("#" + download0Id )
        //         .append("text")
        //         .attr("class", "plus")
        //         .text("+")
        //         .attr("font-size", 46)
        //         .attr("pointer-events", "none")
        //         .attr("x", 2)
        //         .attr("y", 10);

          d3.select("#graph").selectAll("rect")
            /* 	On hover, shows bar label and dep lines;
            	brightens and lengthens bars 					*/
            .on("mousemove", function(d) {
                if (!dragging) {
                    var graph = document.getElementById("graph");
                    //var matrix = this.getTransformToElement(graph);

                    // positions label and makes visible
                    d3.select("#activityDescr")
                        .html(d.descr);
                    d3.select("#activityDescr").transition()
                        .duration(200)
                        //.style("opacity", 1)
                        .style('display', 'inline-block');


                    // brightens bar on hover
                    d3.select(this).style("fill", d3.rgb(d3.select(this).attr("fill")).brighter());
                    // show this bar's dep lines
                    me._colorLines(true, d);
                }
            })
            .on("mouseout", function(d) {
                if (!dragging) {
                    // hide description tooltip
                    d3.select("#activityDescr")
                      .style('display', 'none');
                    // d3.select("#descr").transition()
                    //     .duration(10)
                    //     .style("opacity", 0);
                    // // return to normal color
                    if (!d3.select(this).classed("selected"))
                        d3.select(this).style("fill", d3.rgb(d3.select(this).attr("fill")));
                    // hide dep lines, reset critical path setting
                    me._colorLines(false, d);
                    me.showAllLines();
                    me.showCriticalPath();
                }
            });
            // .on("dblclick", function(d){
            //   mergedToggle = !mergedToggle;
            // });

    },

    /* draw a shadow of every bar, runs only once				*/
    _drawShadow: function() {
        if (first) {
            d3.select("#graph").selectAll("rect")
                .each(function(d) {
                    // draws below the other bars
                    d3.select("#graph").insert("g", "#lineLabel")
                        .attr("class", "shadow-group")
                        .attr("transform", "translate(" + xScale(d.start) + "," +
                            (yScale(d.row) + margin.top) + ")")
                        .append("rect")
                        .attr("class", "shadow")
                        .attr("width", xScale(d.end - d.start))
                        .attr("height", barHeight)
                        .attr("fill", "lightgray")
                        .attr("opacity", 0.6)
                        .attr("rx", barCurve)
                        .attr("ry", barCurve)
                        //                            .attr("display", "none")
                        // start, end, height
                        .data([{
                            st: d.start,
                            en: d.end,
                            h: d.download_group
                        }]);
                });
        }
        first = !first;
    },

    /*	draws loadline #'trail' with 'color', runs only once	*/
    _drawLoadLines: function(_time, trail, color) {
        d3.select("#graph").append("text")
            .attr("class", "finalLoadLine")
            //.text(Math.round(this.loadTime).toLocaleString() + "(ms) onload")
            .text(Math.round(_time).toLocaleString() + "(ms) " )
            .attr("id", "lineLabel" + trail)
            .attr("fill", color)
            .attr("font-size", "10px")
            .attr("x", w - 50)
            .attr("dy", "-0.3em");
        d3.select("#graph").append("line")
            .attr("id", "loadLine" + trail)
            .style("stroke", color)
            .attr("x1", w)
            .attr("x2", w)
            .attr("y1", 0)
            .attr("y2", h + margin.top + margin.bottom);
    },

    /*	Draws loadMetrics 	*/
    _drawLoadMetric: function(_time, _label, color) {
      var div = d3.select("body").append("div")
          .attr("class", "tooltip")
          .attr("id", "loadMetricText" + _label)
          .style("opacity", 0);
        d3.select("#graph").append("line")
            .attr("id", "loadMetric" + _label)
            .style("stroke", color)
            .style("stroke-width", 1.5)
            //.style("stroke-dasharray", "5,10,5")
            .attr("x1", xScale(_time))
            .attr("x2", xScale(_time))
            .attr("y1", 0)
            .attr("y2", h + margin.top + margin.bottom);
    },
    /* 	draws axis and grid, ticks: # of ticks */
    _drawAxis: function(ticks) {
        var loadTime = this.loadTime;
        // console.log('last activity: ' + loadTime);
        // console.log("firstMeaningfulPaint: " + this.firstMeaningfulPaint);
        // console.log("firstContentfulPaint: " + this.firstContentfulPaint);
        // console.log("firstPaint: " + this.firstPaint);
        // console.log("domContentLoadedEventEnd: " + this.domContentLoadedEventEnd);
       /*
        * generate the tickvalues here. If the total loadtime is less than 1000,
        * generate 200 * 5 ticks, else 500 seperated
        */

        var lastTick = xScale.ticks().length - 1;
        var tickvals = xScale.ticks();
        var numTicks = tickvals.length;
        var tickInterval = numTicks > 1 ? (tickvals[1] - tickvals[0]) : loadTime/ticks;
        if (numTicks > 1 && Math.abs(loadTime - tickvals[numTicks - 1]) < tickInterval) {
            tickvals.splice(numTicks - 1, 1);
        }

        //define x-axis
        var xAxis = d3.axisTop()
            .scale(xScale)
            // .ticks(ticks)
            .tickValues(tickvals)
            .tickSizeInner(-h - margin.top - margin.bottom)
            .tickSizeOuter(0)
            .tickFormat(function(d, i) {
                if (d == loadTime) {
                    return d + "(ms) onload";
                    //return d
                } else {
                    return d + "(ms)";
                    //return d
                }
            });
        // d3.select("#mySVG").insert("text", "#graph")
        //     .attr("x", 25)
        //     .attr("y", 12)
        //     .text("(ms)")
        //     .style("fill", "darkgray")
        //     .style("font-size", "10px");
        //draw x-axis beneath the bars
        d3.select("#graph").insert("g", "#lineLabel")
            .attr("id", "topAxis")
            .call(xAxis);
    },

    /* Draw the dependency lines */
    _drawLines: function(mergedToggle) {
        var data = this.dataset;
        var deps = this.deps;
        var dataHash = this.dataHash;
        var me = this;
        deps.forEach(function(elem, index) {
            var a1_id = elem.a1,
            a2_id = elem.a2,
            a1 = data[dataHash[a1_id]],
            a2 = data[dataHash[a2_id]];

            var a1_start = xScale(a1.startTime),
                a2_start = xScale(a2.startTime),
                a1_end = xScale(a1.endTime),
                a2_end = xScale(a2.endTime),
                a1_y = yScale(me.getRowNumber(a1.row, a1_id, mergedToggle)) + margin.top + (barHeight / 2),
                a2_y = yScale(me.getRowNumber(a2.row, a2_id, mergedToggle)) + margin.top + (barHeight / 2);
            if (Math.ceil(a1_y) === Math.ceil(a2_y)) {
                // Horizontal Line
                if (elem.time != -1) {
                    a1_end = xScale(elem.time);
                }
                if (d3.select("#line_" + a1_id + "__" + a2_id).empty()) {
                    // if no lines are drawn yet:
                    d3.select("#graph").append("line")
                        .attr("class", "dependLines")
                        .attr("id", "line_" + a1_id + "__" + a2_id);
                }
                d3.select("#line_" + a1_id + "__" + a2_id).transition() // Hori.
                    .duration(ttime)
                    .attr("x1", a1_end) // offset: see _miniExpand
                    .attr("x2", a2_start)
                    .attr("y1", a1_y)
                    .attr("y2", a1_y)
            } else {
                // Vertical Line - Can be straight or 'L' shaped
                if (elem.time != -1) {
                    a1_end = xScale(elem.time);
                }
                if (d3.select("#line_" + a1_id + "__" + a2_id).empty()) {
                    // if no lines are drawn yet:
                    d3.select("#graph").append("line")
                        .attr("class", "dependLines")
                        .attr("id", "line_" + a1_id + "__" + a2_id);
                }
                if (d3.select("#line_v_" + a1_id + "__" + a2_id).empty()) {
                    // if no lines are drawn yet:
                    d3.select("#graph").append("line")
                        .attr("class", "dependLines")
                        .attr("id", "line_v_" + a1_id + "__" + a2_id);
                }
                d3.select("#line_" + a1_id + "__" + a2_id).transition()
                    .duration(ttime)
                    .attr("x1", a1_end) // offset: see _miniExpand
                    .attr("x2", a1_end)
                    .attr("y1", a1_y)
                    .attr("y2", a2_y);
                d3.select("#line_v_" + a1_id + "__" + a2_id).transition() // Vert.
                    .duration(ttime)
                    .attr("x1", a1_end)
                    .attr("x2", a2_start)
                    .attr("y1", a2_y)
                    .attr("y2", a2_y);
            }
        });
    },

    /* 	colors prev lines blue, next lines orange 				*/
	_colorLines: function(mouseOn, d) {
		for (var j = 0; j < d.prev.length; j++) {
            var lineid = "line_" + d.prev[j].id + "__" + d.id;
            var linevid = "line_v_" + d.prev[j].id + "__" + d.id;
            if (!d3.select("#" + lineid).empty()) {
                this._setColor(mouseOn, "#" + util.getLineColor("from"), lineid);
            }
            if (!d3.select("#" + linevid).empty()) {
                this._setColor(mouseOn, "#" + util.getLineColor("from"), linevid);
            }
        }
        for (var j = 0; j < d.next.length; j++) {
            var lineid = "line_" + d.id + "__" + d.next[j].id;
            var linevid = "line_v_" + d.id + "__" + d.next[j].id;
            if (!d3.select("#" + lineid).empty()) {
                this._setColor(mouseOn, "#" + util.getLineColor("to"), lineid);
            }
            if (!d3.select("#" + linevid).empty()) {
                this._setColor(mouseOn, "#" + util.getLineColor("to"), linevid);
            }
        }
	},

    /* 	helper function; colors lines							*/
    _setColor: function(active, color, lineId) {
        var size, state;
        if (active) {
            size = "2px";
            state = "visible";
            // bring line to the front
            //document.getElementById("graph").appendChild(document.getElementById(lineId));
        } else {
            color = "black";
            size = "1px";
            state = "hidden";
        }

        d3.select("#" + lineId)
            .style("stroke-width", size)
            .style("stroke", color);
         //if dep lines are not toggled all on, changes visibility
          // if (!allVisible)
            d3.select("#" + lineId).style("visibility", state);
    },



    /*	toggles show/hide all dependency lines 					*/
    showAllLines: function() {
      var _cb = document.getElementById("ui-checkbox-label2");
      var deplines = d3.selectAll(".dependLines");
      d3.selectAll(".dependLines")
          .style("visibility", function() {
              if (_cb.checked) {
                  return 'visible';
              } else {
                  return 'hidden';
              }
          });
      this.showCriticalPath();
    },

    showCriticalPath: function() {
      var _cb = document.getElementById("ui-checkbox-label1");
      _this = this;
      this._drawBars(_cb.checked);
      // var _on = cb.checked;
      for (var i = 0; i < critPath.length - 1; i++) {
          var lineid = "line_" + critPath[i] + "__" + critPath[i + 1];
          var linevid = "line_v_" + critPath[i] + "__" + critPath[i + 1];
          if (!(d3.select("#" + lineid).empty())) {
              _this._setColor(_cb.checked, "red", lineid);
          }
          if (!(d3.select("#" + linevid).empty())) {
              _this._setColor(_cb.checked, "red", linevid);
          }
      }
    },

    _makeList: function() {
        var canv = this;
        var list = d3.select("#checks");
        list.style("display", "none");
        d3.select("#graph").selectAll("rect").each(function(d) {
            if (d.info == "javascript:text" || d.info == "application:javascript") {
                var thisrect = this;
                list.append("span")
                    .text(function() {
                        var str = d.url;
                        if (d.url.length > 53) {
                            str = d.url.substr(0, 30);
                            str += "...";
                            str += d.url.substr(d.url.length - 20);
                        }
                        return str + " : ";
                    }).select(function() {
                        return this.parentNode;
                    }).append("input").attr("type", "checkbox")
                    .attr("id", "check_" + d.id)
                    .attr("checked", "checked")
                    .on("change", function() {
                        canv._onCheckChange(d, this, thisrect);
                    });
                list.append("br");
            }
        });
    },

    /* draws the entire graph */
    draw: function(mergedToggle) {
      var _colormap = {
        "firstPaint": "#2757ae",
        "domContentLoaded": "#a8c5f7",
        "firstContentfulPaint": "#c79efa",
        "onLoad": "#eb5bc0",
        "timeToInteractive": "#13bd0d"
      }
        // // bar label, starts hidden
        // d3.select("#parent").insert("div", "svg")
        //     // .attr("viewBox","0 0 " + w + " " + h)
        //     // .attr("preserveAspectRatio", "xMinYMin")
        //     // //class to make it responsive
        //     // .classed("svg-content-responsive", true)
        //     .attr("id", "descr")
        //     .style("opacity", 0);
        d3.select("#graph").selectAll(".normal-rect").remove();
        if (d3.selectAll(".shadow-group").empty()) {
            d3.select("#mySVG").append("g") // offset by margins
                .attr("id", "graph")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            // this._drawLoadLines("0", "black");
            this._drawLoadLines(this.loadTime, "", "red");
            // console.log(this.domContentLoadedEventEnd);
            // console.log(this.onLoad);
            // console.log(this.firstPaint);
            if (this.domContentLoadedEventEnd != -1000) {
              this._drawLoadMetric(this.domContentLoadedEventEnd, "domContentLoaded", _colormap["domContentLoaded"]);
            }
            if (this.onLoad != -1000) {
              this._drawLoadMetric(this.onLoad, "onLoad", _colormap["onLoad"]);
            }
            if (this.firstPaint != -1000) {
              this._drawLoadMetric(this.firstPaint, "firstPaint", _colormap["firstPaint"]);
            }
            //this._drawLoadMetric(this.firstMeaningfulPaint, "firstMeaningfulPaint", "blue");
            if (this.firstContentfulPaint != -1000) {
              this._drawLoadMetric(this.firstContentfulPaint, "firstContentfulPaint", _colormap["firstContentfulPaint"]);
            }
            if (this.timeToInteractive != -1000) {
              this._drawLoadMetric(this.timeToInteractive, "timeToInteractive", _colormap["timeToInteractive"]);
            }


            this._drawAxis(10);
        }
        this.mapToMergedRows();
        this._drawBars(mergedToggle);
        this._drawLines(mergedToggle);
        this.init();
        this._makeList();
        this.depLineHandler();
        this.criticalPathHandler();
        //this.mapToMergedRows();

    },

    criticalPathHandler: function (){
      var cb1 = document.getElementById("ui-checkbox-label1");
      cb1.addEventListener('click', (event) => this.showCriticalPath(event));
  },

    depLineHandler: function (){
      var cb2 = document.getElementById("ui-checkbox-label2");
      cb2.addEventListener('click', (event) => this.showAllLines(event));
  },

  mergeToggleHandler:function(event){
    this.mergedToggle = ! this.mergedToggle;
    var me = this;
    d3.select(this)
    .transition()
    .duration(800)
    .call(me.draw(me.mergedToggle));
    console.log(this);
    console.log(me);
  },

  getRowNumber:function(_row, id, mergedToggle){
      // console.log('_row, id');
      // console.log(_row, id);
      if (mergedToggle){
        if (id.startsWith('Render')){
          //console.log(_row);
          return _row;

        }
        else if (id.startsWith('Paint')){
          return _row;
        }
        else{
          if (_row in this.rowMapHash){
            if (this.rowMapHash.hasOwnProperty(_row)){
              //console.log(this.rowMapHash[_row] - 1);
              return this.rowMapHash[_row] - 1;
            }
          }
          else{
            return _row;
          }
        }
      }
      //console.log(_row);
      return _row;
      // if (mergedToggle){
      //   if (id.startsWith('Paint')){
      //     return yScaleMapped(this.mappedMaxRow + 3);
      //   }
      //   else if (id.startsWith('Render')){
      //     return yScaleMapped(this.mappedMaxRow + 4);
      //   }
      //   else{
      //     return yScaleMapped(this.rowMapHash[_row] - 1);
      //   }
      // }
      // return yScale(_row);
  },

    mapToMergedRows: function(){
      var cpRows = [];
      var rowMapHash = {};
      var rowByActivity = {};
      var data = this.dataset;
      var dataHash = this.dataHash;
      var critPath = this.critPath;
      // console.log('data');
      // console.log(data);
      // console.log('this.segmentRows');
      // console.log(this.segmentRows);
      var cpLength = critPath.length;
      // console.log('cpLength');
      // console.log(cpLength);
      for (var i=0; i< cpLength; i++){
        var cpElem = data[dataHash[critPath[i]]];
        // console.log('critPath[i]');
        // console.log(critPath[i]);
        // console.log('dataHash');
        // console.log(dataHash);
        // console.log('cpElem');
        // console.log(cpElem);
        //cpRows contains row numers that include one critical element.
        if (!(cpRows.includes(cpElem.row))){
          cpRows.push(cpElem.row);
         }
        cpRows.sort((a, b) => {
          return a -b ;
        });
      }
      // console.log('cpRows');
      // console.log(cpRows);

      var cpIdx = 0;
      var segNewIdx = 0;
      var segIdx = 0;

      // var rowLength = Object.keys(this.segmentRows).length;

      for(var idx=0; idx<cpRows.length; idx++ ){
        cpIdx = cpRows[idx];
        var firstTimeHTML = true;
        var firstTimeJs = true;
        var firstTimeCss = true;
        var firstTimeImage = true;
        var firstTimeFont = true;
        var firstTimeOther = true;
        var htmlOffset = 0;
        var jsOffset = 0;
        var cssOffset = 0;
        var imageOffset = 0;
        var fontOffset = 0;
        var otherOffset = 0;
        var offset = 0;

          //group  similar types in each segment
        while (segIdx < cpIdx){
          // console.log('segIdx, cpIdx');
          // console.log(segIdx + ',  ' + cpIdx);
          var activityId = this.segmentRows[segIdx][0];
          var type = this.segmentRows[segIdx][1];
          // console.log('activityId');
          // console.log(activityId);
          // console.log('type');
          // console.log(type);
          switch(type) {
            case 'html':
                segIdx++;
                if (firstTimeHTML){
                  offset++;
                  firstTimeHTML = false;
                  htmlOffset += offset ;
                }
                rowByActivity[activityId] = segNewIdx + htmlOffset;
                rowMapHash[segIdx-1] = segNewIdx + htmlOffset;
                break;
            case 'js':
                segIdx++;
                if (firstTimeJs){
                  offset++;
                  firstTimeJs = false;
                  jsOffset += offset;
                }
                rowByActivity[activityId] = segNewIdx + jsOffset;
                rowMapHash[segIdx-1] = segNewIdx + jsOffset;
                break;
            case 'css':
                segIdx++;
                if (firstTimeCss){
                  offset++;
                  firstTimeCss = false;
                  cssOffset += offset;
                }
                rowByActivity[activityId] = segNewIdx + cssOffset;
                rowMapHash[segIdx-1] = segNewIdx + cssOffset;
                break;
            case 'image':
                segIdx++;
                if (firstTimeImage){
                  offset++;
                  firstTimeImage = false;
                  imageOffset += offset;
                }
                rowByActivity[activityId] = segNewIdx + imageOffset;
                rowMapHash[segIdx-1] = segNewIdx + imageOffset;
                break;
            case 'font':
                segIdx++;
                if (firstTimeFont){
                  offset++;
                  firstTimeFont = false;
                  fontOffset += offset;
                }
                rowByActivity[activityId] = segNewIdx + fontOffset;
                rowMapHash[segIdx-1] = segNewIdx + fontOffset;
                break;
            case 'other':
                segIdx++;
                if (firstTimeOther){
                  offset++;
                  firstTimeOther = false;
                  otherOffset += offset;
                }
                // console.log('segIdx, otherOffset, offset, In other');
                // console.log(segIdx, otherOffset,offset );
                rowByActivity[activityId] = segNewIdx + otherOffset;
                rowMapHash[segIdx-1] = segNewIdx + otherOffset;
                break;
              default:
                  segIdx++;
              }


        }
        segNewIdx = segNewIdx + offset + 1;
        rowByActivity[this.segmentRows[segIdx][0]] = segNewIdx ;//critical border inclusive
        rowMapHash[segIdx] = segNewIdx ;//critical border inclusive
        // console.log('segNewIdx: ' + segNewIdx);
        // console.log('rowMapHash');
        // console.log(rowMapHash);
        segIdx = cpIdx + 1;
      }
    this.rowMapHash = rowMapHash;
    let arr = Object.values(rowMapHash);
    this.mappedMaxRow = Math.max(...arr);
    // yScaleMapped = d3.scaleLinear()
    //     .domain([0, this.mappedMaxRow + 5])
    //     .range([0, h]);
    // console.log('rowByActivity');
    // console.log(rowByActivity);
    // console.log('this.rowMapHash');
    // console.log(this.rowMapHash);
  }
}
/* Legend for Colors */
function legend(selection) {

    colorMap = new Object({
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

    var colorKey = [
        // Downloading
        {
            keyl: "JS Download",
            clr: colorMap["djs"]
        },
        {
            keyl: "Text Download",
            clr: colorMap["dtext"]
        },
        {
            keyl: "CSS Download",
            clr: colorMap["dcss"]
        },
        {
            keyl: "Image Download",
            clr: colorMap["dimg"]
        },
        {
            keyl: "Font Download",
            clr: colorMap["dfont"]
        },

        // Loading
        {
            keyl: "Parse HTML",
            clr: colorMap["ctext"]
        },
        {
            keyl: "Parse CSS",
            clr: colorMap["ccss"]
        },

        // Scripting
        {
            keyl: "Scripting",
            clr: colorMap["cjs"]
        },

        // Render, Paint and Other
        {
            keyl: "Rendering",
            clr: colorMap["render"]
        },
        {
            keyl: "Painting",
            clr: colorMap["paint"]
        },
        {
            keyl: "Other",
            clr: colorMap["dother"]
        }
    ];

    selection.selectAll("g")
        .data(colorKey)
        .enter()
        .append("g")
        .append("div")
        .style("border-radius", "5px")
        .style("height", '15px')
        .style("background-color", function(d) {
            return d.clr;
        });
    selection.selectAll("g").append("span").text(function(d) {
        return d.keyl;
    });
}


/* Legend for Colors */
function metricLegend(selection) {

    colorMap = new Object({
        "firstPaint": "#2757ae",
        "domContentLoaded": "#a8c5f7",
        "firstContentfulPaint": "#c79efa",
        "onLoad": "#eb5bc0",
        "timeToInteractive": "#13bd0d"
        // "dcss": "#8ae887",
        // "cother": "#eb5bc0",
        // "dother": "#eb5bc0",
        // "dfont": "#c415be",
        // "dimg": "#c79efa",
        // "render": "#9b82e3",
        // "paint": "#76b169"
    });
    var colorKey = [
        // Downloading
        {
            keyl: "firstPaint",
            clr: colorMap["firstPaint"]
        },
        {
            keyl: "domContentLoaded",
            clr: colorMap["domContentLoaded"]
        },
        {
            keyl: "firstContentfulPaint",
            clr: colorMap["firstContentfulPaint"]
        },
        {
            keyl: "onLoad",
            clr: colorMap["onLoad"]
        },
        {
            keyl: "timeToInteractive",
            clr: colorMap["timeToInteractive"]
        }

    ];

    selection.selectAll("g")
        .data(colorKey)
        .enter()
        .append("g")
        .append("div")
        //.style("border-radius", "5px")
        .style("height", '2px')
        .style("background-color", function(d) {
            return d.clr;
        });
    selection.selectAll("g").append("span").text(function(d) {
        return '\u00A0' + d.keyl;

    });
}


SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
    return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};
