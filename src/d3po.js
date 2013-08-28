var d3po = window.d3po || {};

d3po.version = '0.1';
d3po.chartcount = 0;

d3po.css = '<style type="text/css">' +
           'svg { font: 10px sans-serif; shape-rendering: crispEdges; }' +
           '.axis path { fill: none; stroke: #333; }' +
           '.axis line { fill: none; stroke: #999; stroke-dasharray: 2,2; }' +
           '</style>';
if($) { $(d3po.css).appendTo("head"); }

window.d3po = d3po;

d3po.dispatch = d3.dispatch("update");

d3po.randomData = function() { //# groups,# points per group
    var data = [],
        groups = 3,
        points = 50,
        shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'],
        random = d3.random.normal();

    /*
    for (i = 0; i < groups; i++) {
        data.push({
                   key: 'Group ' + i,
                   values: []
                  });

        for (j = 0; j < points; j++) {
            data[i].values
                   .push({
                        x: random(), 
                        y: random(), 
                        size: Math.random(), 
                        shape: shapes[j % 6]
                    });
        }
    }
    */

    data.push({
                x: random(), 
                y: random(), 
                size: Math.random(), 
                shape: "circle"
            });

    return data;
}

d3po.counter = function() {

    var counts = {},
        get = null,
        getNew = null;

    get = function(key) {
        return counts.hasOwnProperty(key) ? counts[key] : false;
    }

    next = function(key) {
        if(get(key)) {
            counts[key] += 1;
        } else {
            counts[key] = 0;
        }
        return counts[key];
    }

    return { get: get, next: next }

}

d3po.chart = function(opts) {

    var opts = opts || {};
    var chartdata = {};
    var data = {};

    var lines, scatter, axis, grid, zoom, init;

    lines = function() {

    }

    scatter = function() {

        var test_data = d3po.randomData();

        var points = chartdata.chartarea
                 .append("g")
                 .attr({
                    id: "scatter_"+chartdata.counter.next('scatter')
                  })
                 .selectAll("circle")
                 .data(test_data);
        points.enter()
              .append("circle");

        update_points = function() {
              points.attr({
                    r: function(d) { console.log(d); return 10; },
                    x: function(d) { console.log(chartdata.xscale(d.x)); return chartdata.xscale(d.x); },
                    y: function(d) { return chartdata.yscale(d.y); }
                });
        };
        d3po.dispatch.on("update",update_points);
        d3po.dispatch.update();


    }

    bars = function() {

    }

    axis = function(axis_opts) {
        axis_opts = axis_opts || {};
        axis_opts = {
            tickSize: axis_opts.tickSize || 4,
        };

        var xAxis = d3.svg
                      .axis()
                      .scale(chartdata.xscale)
                      .orient("bottom")
                      .tickSize(-chartdata.chart_width);
                      //.tickSize(axis_opts.tickSize);

        var yAxis = d3.svg
                      .axis()
                      .scale(chartdata.yscale)
                      .orient("left")
                      .tickSize(-chartdata.chart_height);

        chartdata.chartarea
                .append("g")
                .attr({
                    "transform":"translate(0,"+chartdata.chart_height+")",
                    "class":"x axis"
                 })
                .call(xAxis);

        chartdata.chartarea
                .append("g")
                .attr({
                    "class": "y axis"
                 })
                .call(yAxis);


        chartdata.xAxis = xAxis;
        chartdata.yAxis = yAxis;
    }

    grid = function(grid_opts) {
        grid_opts = grid_opts || {};
        grid_opts = {
            color: grid_opts.color || '#fff'
        };

        chartdata.chartarea
                .append("g")
                .attr({
                });
    }

    zoom = function() {

        var zoomed = function() {
            chartdata.chartarea.select(".x.axis").call(chartdata.xAxis);
            chartdata.chartarea.select(".y.axis").call(chartdata.yAxis);
            d3po.dispatch.update();
        }
        var z = d3.behavior.zoom()
                  .x(chartdata.xscale)
                  .y(chartdata.yscale)
                  .scaleExtent([1,10])
                  .on("zoom",zoomed);
        chartdata.chartarea.call(z);
    }

    // set everything up
    init = function() {

        // initialize all unset options
        opts = {
            width: opts.width || 600,
            height: opts.height || 600,
            margin: opts.margin || {top: 40, right:40, bottom: 40, left:40}, // margin around charting area in pixels
            target: opts.target || 'body', // target html element to append svg to
            name: opts.name || 'chart_'+d3po.chartcount,
            background: opts.background || "#eee",
            axis: opts.axis || true,
            grid: opts.grid || true,
            zoom: opts.zoom || true
        }

        // increment the global chartcount so multiple charts don't
        // clobber each other
        d3po.chartcount += 1;

        // insert the svg
        var svg = d3.select(opts.target)
                    .append('svg');
        svg.attr({
               width: opts.width,
               height: opts.height,
                  id: opts.name
            });

        // chart area
        var chartarea = svg.append("g")
                           .attr({
                                id: "chartarea",
                                transform: "translate("+[opts.margin.left,opts.margin.top].join(',')+")"
                            });
        var chart_width = opts.width - opts.margin.left - opts.margin.right;
        var chart_height = opts.height - opts.margin.top - opts.margin.bottom;

        chartarea.append("rect")
                 .attr({
                        width: chart_width,
                        height: chart_height
                  })
                 .style({
                        fill: opts.background
                  });

        // initialize some objects that will be used later
        chartdata = {
            chart_width: chart_width,
            chart_height: chart_height,
            xscale: d3.scale.linear().domain([0,1]).range([0,chart_width]),
            yscale: d3.scale.linear().domain([0,1]).range([chart_height,0]),
            xlim: [0,1],
            ylim: [0,1],
            svg: svg,
            chartarea: chartarea,
            counter: d3po.counter()
        }

        // add stuff unless asked not to
        opts.axis && axis();
        opts.grid && grid();
        opts.zoom && zoom();

    }
    init();

    return {lines:lines,
            scatter:scatter,
            bars:bars,
            axis:axis
           }
}
