var d3po = window.d3po || {};

d3po.version = '0.1';
d3po.chartcount = 0;

d3po.css = '<style type="text/css">' +
           'svg { font: 10px sans-serif; }' +
           '.axis path { fill: none; stroke: #333; }' +
           '.axis line { fill: none; stroke: #999; stroke-dasharray: 2,2; }' +
           '.label { color: black; }' + 
           '</style>';
if($) { $(d3po.css).appendTo("head"); }

window.d3po = d3po;

d3po.dispatch = d3.dispatch("update","reset","mouseover","mouseout");
d3po.util = {
    translate: function(l) {
        return "translate("+l.join(',')+")";
    }
}

d3po.randomScatter = function() { //# groups,# points per group
    var data = [],
        groups = 3,
        points = 10,
        shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'],
        colors = ['red','blue','cyan','green','orange','black','purple']
        random = d3.random.normal();

    for(var i = 0; i < points; i++) {
        data.push({
                    x: random(), 
                    y: random(), 
                    size: Math.random(), 
                    shape: shapes[i%shapes.length],
                    color: colors[i%colors.length],
                    alpha: Math.min(1,0.5+Math.random())
                });
    }

    return data;
}

d3po.randomLine = function() {
    var x = [],
        y = [],
        data = [],
        points = 15;

    for(var i = 0; i < points; i++) {
        x.push(d3.random.normal()());
        y.push(d3.random.normal()());
    }

    x.sort(function(a,b){return a-b;});

    for(var i = 0; i < points; i++) {
        data.push({x:x[i],y:y[i]});
    }

    return data;
}

d3po.counter = function() {

    var counts = {},
        get = null;

    get = function(key) {
        return counts[key];
    }

    next = function(key) {
        if(counts.hasOwnProperty(key)) {
            counts[key] += 1;
        } else {
            counts[key] = 0;
        }
        return counts[key];
    }

    return { get: get, next: next, counts:counts}

}

d3po.chart = function(opts) {

    var opts = opts || {};
    var chartdata = {};
    var data = {};

    var lines, scatter, axis, grid, zoom, init;

    lines = function(data,line_opts) {
        line_opts = line_opts || {};

        line_opts = {
                     color: line_opts.color || "black",
                     stroke_width: line_opts.stroke_width || 1,
                     extend_edges: line_opts.extend_edges
                    };

        var id = "line_"+chartdata.counter.next("line");
        var line_p = chartdata.chartarea
                .append("g")
                .attr({
                    id: id
                 })
                .append("path")
                .data(data);

        var line_g = d3.svg.line()
                .x(function(d) { return chartdata.xscale(d.x); })
                .y(function(d) { return chartdata.yscale(d.y); });

        var update_lines = function() {
            var prefix = [],
                postfix = [];

            if(line_opts.extend_edges) {
                var f = function(p1,p2,x) {
                    var m = (p1.y-p2.y)/(p1.x-p2.x);
                    var b = p1.y - m*p1.x;
                    return m*x+b
                }
                var p1 = data[0], p2 = data[1];
                var x = chartdata.xscale.domain()[0];
                prefix.push({x:x,y:f(p1,p2,x)});

                var p1 = data[data.length-2], p2 = data[data.length-1];
                var x = chartdata.xscale.domain()[1];
                postfix.push({x:x,y:f(p1,p2,x)});

            }
            line_p.attr({
                d: line_g(prefix.concat(data,postfix)),
                stroke: line_opts.color,
                "stroke-width": line_opts.stroke_width,
                fill: "none"
               });
       }
       d3po.dispatch.on("update."+id,update_lines);
       d3po.dispatch.update();
       d3po.dispatch.reset();
    }

    scatter = function(data,scatter_opts) {
        scatter_opts = scatter_opts || {};

        scatter_opts = {
                        //scale_mode: scatter_opts.scale_mode || "median"
                       }
        var id = "scatter_"+chartdata.counter.next('scatter');

        // create a d3.scale that converts the datapoint sizes
        // appropriately
        var size_min = d3.min(data,function(d) { return d.size; });
        var size_max = d3.max(data,function(d) { return d.size; });
        var size_scale = d3.scale.linear();
        if(size_min && size_max) {
            size_scale.domain([size_min,size_max])
                      .range([30,300]);
        }

        var xExtent = d3.zip(chartdata.data_xlim,d3.extent(data,function(d) { return d.x; }));
        chartdata.data_xlim = [d3.min(xExtent[0]),d3.max(xExtent[1])];
        var yExtent = d3.zip(chartdata.data_ylim,d3.extent(data,function(d) { return d.y; }));
        chartdata.data_ylim = [d3.min(yExtent[0]),d3.max(yExtent[1])];

        var points = chartdata.chartarea
                 .append("g")
                 .attr({
                    id: id
                  })
                 .selectAll("path")
                 .data(data);
        points.enter()
              .append("path")
              .on({
                    mouseover:d3po.dispatch.mouseover,
                    mouseout:d3po.dispatch.mouseout
                  });

        update_points = function() {
              points.attr({
                        d: function(d) { return d3.svg.symbol().type(d.shape).size(size_scale(d.size || 30))(); },
                        transform: function(d) {
                            var transform_str = d3po.util.translate([chartdata.xscale(d.x),chartdata.yscale(d.y)]);
                            if(d3.event && opts.zoom_opts && opts.zoom_opts.geometric) {
                                transform_str += " scale(" + d3.event.scale + ")";
                            }
                            return transform_str;
                        },
                        fill: function(d) { return d.color || 'blue'; },
                        "fill-opacity": function(d) { return d.alpha; }
                     })

        };
        d3po.dispatch.on("update."+id,update_points);
        d3po.dispatch.update();
        d3po.dispatch.reset();

    }

    bars = function() {

    }

    axis = function(axis_opts) {
        axis_opts = axis_opts || {};
        axis_opts = {
            xLabel: axis_opts.xLabel || null,
            yLabel: axis_opts.yLabel || null,
            tickSize: axis_opts.tickSize || 4,
        };

        var xAxis = d3.svg
                      .axis()
                      .scale(chartdata.xscale)
                      .orient("bottom")
                      .tickSize(-chartdata.chart_height);
                      //.tickSize(axis_opts.tickSize);

        var yAxis = d3.svg
                      .axis()
                      .scale(chartdata.yscale)
                      .orient("left")
                      .tickSize(-chartdata.chart_width);

        // add the x and y axes to the svg
        var xAxis_g = chartdata.svg
                        .append("g")
                        .attr({
                            "transform":d3po.util.translate([opts.margin.left,(opts.margin.top+chartdata.chart_height)]),
                            "class":"x axis"
                         })
                        .call(xAxis);

        var yAxis_g = chartdata.svg
                .append("g")
                .attr({
                    "class": "y axis",
                    transform: d3po.util.translate([opts.margin.left,opts.margin.top])
                 })
                .call(yAxis);

        // add x and y labels if set
        if(axis_opts.xLabel) {
            xAxis_g.append("text")
                   .attr({
                          "class": "x label",
                          "text-anchor": "middle",
                          transform: d3po.util.translate([chartdata.chart_width/2,25])
                         })
                   .text(axis_opts.xLabel);
        }
        if(axis_opts.yLabel) {
            yAxis_g.append("text")
                   .attr({
                          "class": "x label",
                          "text-anchor": "middle",
                          transform: d3po.util.translate([-25,chartdata.chart_height/2])+"rotate(-90)"
                         })
                   .text(axis_opts.yLabel);
        }

        chartdata.xAxis = xAxis;
        chartdata.yAxis = yAxis;

    }

    grid = function(grid_opts) {
        grid_opts = grid_opts || {};
        grid_opts = {
            color: grid_opts.color || '#eee'
        };

        chartdata.chartarea
                .append("g")
                .attr({
                });
    }

    zoom = function(zoom_opts) {

        zoom_opts = zoom_opts || {};

        zoom_opts = {
                     geometric: zoom_opts.geometric || false
                    }

        opts.zoom_opts = zoom_opts;

        // zoom is currently only implemented when axis is on
        if(opts.axis) {
            opts.zoom = true;
            var zoomed = function() {
                chartdata.svg.select(".x.axis").call(chartdata.xAxis);
                chartdata.svg.select(".y.axis").call(chartdata.yAxis);
                d3po.dispatch.update();
            }
            var z = d3.behavior.zoom()
                      .x(chartdata.xscale)
                      .y(chartdata.yscale)
                      .on("zoom",zoomed);
            chartdata.zoom = z;
            chartdata.chartarea.call(z);
        }
    }

    legend = function(legend_opts) {

    }

    tooltips = function(tooltip_opts) {
        tooltip_opts = tooltip_opts || {};

        tooltip_opts = {
                       };

        var id = "tooltip";
        var tooltip_g = chartdata.svg
            .append("g")
            .attr({
                    id: id,
                    visibility: "visible",
                    opacity: 0 
                  });
            
        var update_tooltip = function(d,i) {

            tooltip_g.selectAll("text")
                     .data(d3.entries(d))
                     .enter()
                     .append("text")
                     .attr({
                        x: 0,
                        y: function(d,i) { return 11*i; }
                      })
                     .text(function(d,i) {
                        return d.key+": "+d.value;
                      });


            tooltip_g.append("rect")
                .attr({
                        fill: "orange",
                        stroke: "none",
                        width: 50,
                        height: 50,
                        rx:5,
                        ry:5
                      });

            tooltip_g.attr({
                            transform: function() {
                                    var transform_str = d3po.util.translate([chartdata.xscale(d.x)+opts.margin.left,chartdata.yscale(d.y)+opts.margin.top]);
                                    if(d3.event && opts.zoom_opts && opts.zoom_opts.geometric) {
                                        transform_str += " scale(" + d3.event.scale + ")";
                                    }
                                    return transform_str;
                                }
                            })
                     .transition()
                     .duration(250)
                     .attr({
                            opacity: 1,
                           });
        }
        d3po.dispatch.on("mouseover.tooltip",update_tooltip);

        var hide_tooltip = function() {
            tooltip_g.attr({
                            opacity: 0
                           });
            tooltip_g.selectAll().remove();
        }
        d3po.dispatch.on("mouseout.tooltip",hide_tooltip);

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
            xlim: opts.xlim || [0,1],
            ylim: opts.ylim || [0,1],
            background: opts.background || "#eee",
            axis: opts.axis == false ? opts.axis : true,
            axis_opts: opts.axis_opts || {},
            grid: opts.grid == false ? opts.grid : true,
            grid_opts: opts.grid_opts || {},
            zoom: opts.zoom == false ? opts.zoom : true,
            zoom_opts: opts.zoom_opts || {},
            tooltips: opts.tooltips == false ? opts.tooltips : true,
            tooltips_opts: opts.tooltips_opts || {}
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

        // add some defs
        var defs = svg.append("defs");

        // chart area
        var chart_width = opts.width - opts.margin.left - opts.margin.right;
        var chart_height = opts.height - opts.margin.top - opts.margin.bottom;

        // this clips drawn objects to only appear in chartarea boundaries
        defs.append("clipPath")
            .attr({id:"chartarea_clip"})
            .append("rect")
            .attr({
                   x:0,
                   y:0,
                   width:chart_width,
                   height:chart_height
                  });

        var chartarea = svg.append("g")
                           .attr({
                                id: "chartarea",
                                "clip-path":"url(#chartarea_clip)",
                                transform: d3po.util.translate([opts.margin.left,opts.margin.top])
                            });

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
            xlim: opts.xlim,
            ylim: opts.ylim,
            data_xlim: [0,1],
            data_ylim: [0,1],
            svg: svg,
            chartarea: chartarea,
            counter: d3po.counter()
        }

        // set viewport to data on reset
        update_viewport = function() {

            chartdata.xscale.domain(chartdata.data_xlim.map(function(d) { return d*1.2; }));
            chartdata.yscale.domain(chartdata.data_ylim.map(function(d) { return d*1.2; }));

            
            if(chartdata.zoom) {
                chartdata.zoom
                         .x(chartdata.xscale)
                         .y(chartdata.yscale);
            }
            chartdata.xAxis && chartdata.svg.select('.x.axis').call(chartdata.xAxis);
            chartdata.yAxis && chartdata.svg.select('.y.axis').call(chartdata.yAxis);

            d3po.dispatch.update();
        }
        d3po.dispatch.on("reset",update_viewport);

        // add stuff unless asked not to
        opts.axis && axis(opts.axis_opts);
        opts.grid && grid(opts.grid_opts);
        opts.zoom && zoom(opts.zoom_opts);
        opts.tooltips && tooltips(opts.tooltip_opts);

    }
    init();

    return {lines:lines,
            scatter:scatter,
            bars:bars,
            axis:axis
           }
}
