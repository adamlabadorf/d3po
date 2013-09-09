var d3po = window.d3po || {};

d3po.version = '0.1';
d3po.chartcount = 0;

// this keeps track of one chart globally for routing keystroke events etc.
d3po.curr_chart = null;

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
        "use strict";
        return "translate("+l.join(',')+")";
    }
};

d3po.shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond',
               'square'];
d3po.colors = ['red','blue','cyan','green','orange','black','purple'];

d3po.randomScatter = function() { //# groups,# points per group
    "use strict";
    var i,
        data = [],
        //groups = 3,
        points = 10,
        shapes = d3po.shapes,
        colors = d3po.colors,
        random = d3.random.normal();

    for(i = 0; i < points; i+=1) {
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
};

d3po.randomLine = function() {
    "use strict";
    var i,
        x = [],
        y = [],
        data = [],
        points = 15;

    for(i = 0; i < points; i+=1) {
        x.push(d3.random.normal()());
        y.push(d3.random.normal()());
    }

    x.sort(function(a,b){return a-b;});

    for(i = 0; i < points; i+=1) {
        data.push({x:x[i],y:y[i]});
    }

    return data;
};

d3po.randomBoxes = function() {
    "use strict";
    var i,
        data = [],
        boxes = 20,
        colors = d3po.colors;
    for(i = 0; i < boxes; i+=1) {
        data.push({
                    x:Math.random(),
                    y:Math.random(),
                    w:100*Math.max(0.1,d3.random.normal(1)()),
                    h:100*Math.max(0.1,d3.random.normal(1)()),
                    fill: colors[i%colors.length],
                    stroke: colors[(i+3)%colors.length],
                    alpha: Math.min(1,0.5+Math.random())
                    });
    }

    return data;

};

d3po.randomBoxGrid = function() {
    "use strict";
    var i,j,
        data = [],
        rows = 10,
        cols = 10,
        colors = d3po.colors,
        w;

    for(i = 0; i < rows;i+=1) {
        for(j = 0; j < cols; j+=1) {
            w = Math.random();
            data.push({
                        x:i,
                        y:j,
                        w:w,
                        h:w,
                        fill: colors[i%colors.length],
                        stroke: colors[(i+3)%colors.length],
                        alpha: Math.min(1,0.5+Math.random())
                        });

        }
    }

    return data;
};

d3po.counter = function() {
    "use strict";

    var counts = {},
        get,
        inc;

    get = function(key) {
        return counts[key];
    };

    inc = function(key) {
        if(counts.hasOwnProperty(key)) {
            counts[key] += 1;
        } else {
            counts[key] = 0;
        }
        return counts[key];
    };

    return { get: get,
             inc: inc,
             counts:counts
           };
};

d3po.chart = function(opts) {
    "use strict";

    var chart_opts = opts || {},
        chart_data = {},
        lines,
        scatter,
        boxes,
        bars,
        axis,
        grid,
        zoom,
        legend,
        tooltips,
        hotkeys,
        init;

    lines = function(data,line_opts) {
        var lopts = line_opts || {},
            id = "line_"+chart_data.counter.inc("line"),
            line_p,
            line_g,
            xExtent, yExtent,
            update_lines;
        
        line_p = chart_data.chartarea
                .append("g")
                .attr({
                    id: id
                 })
                .append("path")
                .data(data);

        line_g = d3.svg.line()
                .x(function(d) { return chart_data.xscale(d.x); })
                .y(function(d) { return chart_data.yscale(d.y); });

        lopts = {
                 color: lopts.color || "black",
                 stroke_width: lopts.stroke_width || 1,
                 extend_edges: lopts.extend_edges
                };

        xExtent = d3.zip(chart_data.data_xlim,
                         d3.extent(data,function(d) { return d.x; }));
        chart_data.data_xlim = [d3.min(xExtent[0]),d3.max(xExtent[1])];

        yExtent = d3.zip(chart_data.data_ylim,
                         d3.extent(data,function(d) { return d.y; }));
        chart_data.data_ylim = [d3.min(yExtent[0]),d3.max(yExtent[1])];

        update_lines = function() {
            var prefix = [],
                postfix = [],
                f, p1, p2, x;

            if(lopts.extend_edges) {
                f = function(p1,p2,x) {
                        var m = (p1.y-p2.y)/(p1.x-p2.x),
                            b = p1.y - m*p1.x;
                        return m*x+b;
                    };
                p1 = data[0];
                p2 = data[1];
                x = chart_data.xscale.domain()[0];
                prefix.push({x:x,y:f(p1,p2,x)});

                p1 = data[data.length-2];
                p2 = data[data.length-1];
                x = chart_data.xscale.domain()[1];
                postfix.push({x:x,y:f(p1,p2,x)});
            }
            line_p.attr({
                d: line_g(prefix.concat(data,postfix)),
                stroke: lopts.color,
                "stroke-width": lopts.stroke_width,
                fill: "none"
               });
       };
       d3po.dispatch.on("update."+opts.name+"."+id,update_lines);
       d3po.dispatch.update();
       d3po.dispatch.reset();
    };

    scatter = function(data,scatter_opts) {
        var sopts = scatter_opts || {},
            id = "scatter_"+chart_data.counter.inc('scatter'),
            size_min, size_max, size_scale,
            xExtent, yExtent,
            points, update_points;

        sopts = {
                   //scale_mode: sopts.scale_mode || "median"
                };
        sopts.scale_mode = "median";

        // create a d3.scale that converts the datapoint sizes
        // appropriately
        size_min = d3.min(data,function(d) { return d.size; });
        size_max = d3.max(data,function(d) { return d.size; });
        size_scale = d3.scale.linear();

        if(size_min && size_max) {
            size_scale.domain([size_min,size_max])
                      .range([30,300]);
        }

        xExtent = d3.zip(chart_data.data_xlim,
                         d3.extent(data,function(d) { return d.x; })
                        );
        chart_data.data_xlim = [d3.min(xExtent[0]),d3.max(xExtent[1])];

        yExtent = d3.zip(chart_data.data_ylim,
                         d3.extent(data,function(d) { return d.y; })
                        );
        chart_data.data_ylim = [d3.min(yExtent[0]),d3.max(yExtent[1])];

        points = chart_data.chartarea
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
                        d: function(d) {
                            return d3.svg.symbol()
                                         .type(d.shape)
                                         .size(size_scale(d.size || 30))();
                        },
                        transform: function(d) {
                            var trnsf = d3.transform(d3.select(this)
                                                       .attr('transform')
                                                    );
                            trnsf.translate = [chart_data.xscale(d.x),
                                               chart_data.yscale(d.y)];
                            if(d3.event && opts.zoom_opts &&
                               opts.zoom_opts.geometric) {
                                trnsf.scale = d3.event.scale;
                            }
                            return trnsf.toString();
                        },
                        fill: function(d) { return d.color || 'blue'; },
                        "fill-opacity": function(d) { return d.alpha; }
                     });

        };
        d3po.dispatch.on("update."+opts.name+"."+id,update_points);
        d3po.dispatch.update();
        d3po.dispatch.reset();

    };

    boxes = function(data,box_opts) {
        var bopts = box_opts || {},
            id,
            box_g, update_boxes,
            get_dims,
            min_x, max_x, min_y, max_y;
        bopts = {
                 anchor: bopts.anchor || "origin"
                };
        id = "boxes_"+chart_data.counter.inc('boxes');

        box_g = chart_data.chartarea
                 .append("g")
                 .attr({
                    id: id
                  })
                 .selectAll("rect")
                 .data(data);
        box_g.enter()
              .append("rect")
              .on({
                    mouseover:d3po.dispatch.mouseover,
                    mouseout:d3po.dispatch.mouseout
                  });

        get_dims = function(d) {
            return [Math.abs(chart_data.xscale(d.w)-chart_data.xscale(0)),
                    Math.abs(chart_data.yscale(d.h)-chart_data.yscale(0))];
        };

        min_x = d3.min(data,function(d) {
            if(bopts.anchor == "center") {
                return d.x-d.w/2;
            }
            return d.x;
        });
        max_x = d3.max(data,function(d) {
            if(bopts.anchor == "center") {
                return d.x+d.w/2;
            }
            return d.x+d.w;
        });

        min_y = d3.min(data,function(d) {
            if(bopts.anchor == "center") {
                return d.y-d.h/2;
            }
            return d.y;
        });
        max_y = d3.max(data,function(d) {
            if(bopts.anchor == "center") {
                return d.y+d.h/2;
            }
            return d.y+d.h;
        });

        chart_data.data_xlim = [Math.min(chart_data.data_xlim[0],min_x),
                                Math.max(chart_data.data_xlim[1],max_x)];

        chart_data.data_ylim = [Math.min(chart_data.data_ylim[0],min_y),
                                Math.max(chart_data.data_ylim[1],max_y)];

        update_boxes = function() {
              box_g.attr({
                        width: function(d) { return get_dims(d)[0]; },
                        height: function(d) { return  get_dims(d)[1]; },
                        transform: function(d) {
                            var transform = d3.transform(d3.select(this)
                                                           .attr("transform")),
                                dims = get_dims(d);
                            if(bopts.anchor == "center") {
                                transform.translate =
                                        [chart_data.xscale(d.x)-dims[0]/2,
                                         chart_data.yscale(d.y)-dims[1]/2];
                            }
                            else {
                                transform.translate =
                                        [chart_data.xscale(d.x),
                                         chart_data.yscale(d.y)-dims[1]];
                            }
                            return transform.toString();
                        }

                    })
                    .style({
                        fill: function(d) { return d.fill || 'blue'; },
                        stroke: function(d) { return d.stroke || 'none'; },
                        "fill-opacity": function(d) { return d.alpha; }
                     });

        };
        d3po.dispatch.on("update."+opts.name+"."+id,update_boxes);
        d3po.dispatch.update();
        d3po.dispatch.reset();

    };

    bars = function() {
        console.log('not implemented yet');
    };

    axis = function(axis_opts) {
        var aopts = axis_opts || {},
            xAxis, yAxis, axis_transform,
            xAxis_g, yAxis_g;

        aopts = {
            xLabel: aopts.xLabel || null,
            yLabel: aopts.yLabel || null,
            tickSize: aopts.tickSize || 4
        };

        xAxis = d3.svg
                  .axis()
                  .scale(chart_data.xscale)
                  .orient("bottom")
                  .tickSize(-chart_data.chart_height);
                  //.tickSize(aopts.tickSize);

        yAxis = d3.svg
                  .axis()
                  .scale(chart_data.yscale)
                  .orient("left")
                  .tickSize(-chart_data.chart_width);

        // add the x and y axes to the svg
        axis_transform = d3.transform()
                           .translate([
                                   opts.margin.left,
                                   (opts.margin.top+chart_data.chart_height)
                                  ]);
        xAxis_g = chart_data.svg
                        .insert("g","#chartarea")
                        .attr({
                            "transform":axis_transform.toString(),
                            "class":"x axis"
                         })
                        .call(xAxis);

        yAxis_g = chart_data.svg
                .insert("g","#chartarea")
                .attr({
                    "class": "y axis",
                    transform: d3.transform()
                                 .translate([opts.margin.left,
                                             opts.margin.top]
                                           )
                                 .toString()
                 })
                .call(yAxis);

        // add x and y labels if set
        if(aopts.xLabel) {
            xAxis_g.append("text")
                   .attr({
                          "class": "x label",
                          "text-anchor": "middle",
                          transform: d3.transform()
                                       .translate([chart_data.chart_width/2,
                                                   25])
                                       .toString()
                         })
                   .text(aopts.xLabel);
        }
        if(aopts.yLabel) {
            yAxis_g.append("text")
                   .attr({
                          "class": "x label",
                          "text-anchor": "middle",
                          transform: d3.transform()
                                       .translate([
                                            -25,
                                            chart_data.chart_height/2])
                                       .rotate(-90)
                                       .toString()
                         })
                   .text(aopts.yLabel);
        }

        chart_data.xAxis = xAxis;
        chart_data.yAxis = yAxis;

    };

    grid = function(grid_opts) {
        grid_opts = grid_opts || {};
        grid_opts = {
            color: grid_opts.color || '#eee'
        };

        chart_data.chartarea
                .append("g")
                .attr({
                });
    };

    zoom = function(zoom_opts) {

        var zopts = zoom_opts || {},
            zoomed, z;

        zopts = {
                     geometric: zopts.geometric || false
                    };

        opts.zopts = zopts;

        // zoom is currently only implemented when axis is on
        if(opts.axis) {
            opts.zoom = true;
            zoomed = function() {
                chart_data.svg.select(".x.axis").call(chart_data.xAxis);
                chart_data.svg.select(".y.axis").call(chart_data.yAxis);
                d3po.dispatch.update();
            };
            z = d3.behavior.zoom()
                      .x(chart_data.xscale)
                      .y(chart_data.yscale)
                      .on("zoom",zoomed);
            chart_data.zoom = z;
            chart_data.chartarea.call(z);
        }
    };

    legend = function() {
        console.log('not implemented yet');
    };

    tooltips = function(tooltip_opts) {
        var topts = tooltip_opts || {},
            id,
            tooltip_g,
            update_tooltip,
            hide_tooltip;

        topts = {
                        offset: topts.offset == undefined ?
                                    10 : topts.offset
                       };

        id = "tooltip";
        tooltip_g = chart_data.svg
            .append("g")
            .attr({
                    id: id,
                    visibility: "visible",
                    opacity: 0 
                  });
            
        update_tooltip = function(d) {

            var pt,
                pt_transform,
                tooltip_rect;

            pt = d3.select(this);
            pt_transform = d3.transform(pt.attr("transform"));

            pt_transform.scale = [2,2];
            pt.transition()
              .duration(300)
              .ease("bounce")
              .attr("transform",pt_transform.toString());

            tooltip_g.selectAll("text")
                     .data(d3.entries(d))
                     .enter()
                     .append("text")
                     .attr({
                        x: 3,
                        y: function(d,i) { d.x; return 11*i+11; }
                      })
                     .text(function(d) {
                        return d.key+": "+d.value;
                      });

            tooltip_rect = tooltip_g.node().getBoundingClientRect();
            tooltip_g.insert("rect",":first-child")
                .attr({
                        fill: "white",
                        stroke: "black",
                        "stroke-width": 0.5,
                        opacity: 0.8,
                        width: tooltip_rect.width*1.1,
                        height: tooltip_rect.height*1.1,
                        rx:5,
                        ry:5
                      });

            // figure out where to put the tooltip

            tooltip_rect.x = chart_data.xscale(d.x)+
                             opts.margin.left+
                             topts.offset;

            tooltip_rect.y = chart_data.yscale(d.y)+
                             opts.margin.top+
                             topts.offset;

            if(tooltip_rect.x+tooltip_rect.width > opts.width) {
                tooltip_rect.x = chart_data.xscale(d.x)+
                                 opts.margin.left-
                                 tooltip_rect.width-topts.offset;
            }
            if(tooltip_rect.y+tooltip_rect.height > opts.height) {
                tooltip_rect.y = chart_data.yscale(d.y) +
                                 opts.margin.top -
                                 tooltip_rect.height -
                                 topts.offset;
            }
            tooltip_g.attr({
                            transform: function() {
                                    var transform = d3.transform()
                                                      .translate([
                                                        tooltip_rect.x,
                                                        tooltip_rect.y]);
                                    if(d3.event && opts.zoom_opts &&
                                       opts.zoom_opts.geometric) {
                                        transform.scale = d3.event.scale;
                                    }
                                    return transform.toString();
                                }
                            })
                     .transition()
                     .duration(250)
                     .attr({
                            opacity: 1
                           });
        };

        d3po.dispatch.on("mouseover."+opts.name+".tooltip",update_tooltip);

        hide_tooltip = function() {

            var pt = d3.select(this),
                pt_transform = d3.transform(pt.attr("transform"));
            pt_transform.scale = [1,1];
            pt.transition()
              .duration(300)
              .ease("bounce")
              .attr("transform",pt_transform.toString());


            tooltip_g.transition()
                     .duration(250)
                     .attr({
                            opacity: 0
                           });
            tooltip_g.selectAll("rect").transition().duration(250).remove();
            tooltip_g.selectAll("text").transition().duration(250).remove();
        };
        d3po.dispatch.on("mouseout."+opts.name+".tooltip",hide_tooltip);

    };

    hotkeys = function() {

        window.focus();
        d3.select(window).on("keydown", function() {
                    console.log(d3po.curr_chart.opts.name);
                    console.log(d3po.curr_chart.data_xlim);
                    console.log(d3po.curr_chart.tooltips);
                    console.log(d3.event.keyCode);
                 });

    };

    // set everything up
    init = function() {

        var svg,
            defs,
            chart_width, chart_height,
            chartarea,
            padding,
            update_viewport;

        // initialize all unset options
        chart_opts = {
            width: opts.width || 600,
            height: opts.height || 600,
            margin: opts.margin || {top: 40, right:40, bottom: 40, left:40},
            target: opts.target || 'body',
            name: opts.name || 'chart_'+d3po.chartcount,
            xlim: opts.xlim || [0,1],
            ylim: opts.ylim || [0,1],
            background: opts.background || "#eee",
            axis: opts.axis == false ? opts.axis : true,
            axis_opts: opts.axis_opts || {},
            padding: opts.padding || "normal",
            grid: opts.grid == false ? opts.grid : true,
            grid_opts: opts.grid_opts || {},
            zoom: opts.zoom == false ? opts.zoom : true,
            zoom_opts: opts.zoom_opts || {},
            tooltips: opts.tooltips == false ? opts.tooltips : true,
            tooltips_opts: opts.tooltips_opts || {},
            hotkeys: opts.hotkeys == false ? opts.hotkeys : true
        };

        // increment the global chartcount so multiple charts don't
        // clobber each other
        d3po.chartcount += 1;

        // insert the svg
        svg = d3.select(chart_opts.target)
                .append('svg');
        svg.attr({
                   width: chart_opts.width,
                   height: chart_opts.height,
                   id: chart_opts.name
            });

        // add some defs
        defs = svg.append("defs");

        // chart area
        chart_width = chart_opts.width -
                      chart_opts.margin.left -
                      chart_opts.margin.right;
        chart_height = chart_opts.height -
                       chart_opts.margin.top -
                       chart_opts.margin.bottom;

        // this clips drawn objects to only appear in chartarea boundaries
        defs.append("clipPath")
            .attr({id:"chartarea_clip_"+chart_opts.name})
            .append("rect")
            .attr({
                   x:0,
                   y:0,
                   width:chart_width,
                   height:chart_height
                  });

        svg.append("rect")
                 .attr({
                        x: chart_opts.margin.left,
                        y: chart_opts.margin.top,
                        width: chart_width,
                        height: chart_height
                  })
                 .style({
                        fill: chart_opts.background
                  });

        chartarea = svg.append("g")
                       .attr({
                            id: "chartarea",
                            "clip-path":"url(#chartarea_clip_" +
                                            chart_opts.name+")",
                            transform: d3.transform()
                                         .translate([
                                            chart_opts.margin.left,
                                            chart_opts.margin.top
                                           ])
                                         .toString()
                        });

        // add an invisible rect so the zoom element works properly
        chartarea.append("rect")
                 .attr({
                        width: chart_width,
                        height: chart_height,
                        opacity: 0
                  });

        // padding adds space around data limits
        switch(chart_opts.padding) {
        case "none":
            padding = 0;
            break;
        case "tight":
            padding = 0.01;
            break;
        default:
            padding = 0.05;
        }

        // initialize some objects that will be used later
        chart_data = {
            chart_width: chart_width,
            chart_height: chart_height,
            xscale: d3.scale.linear().domain([0,1]).range([0,chart_width]),
            yscale: d3.scale.linear().domain([0,1]).range([chart_height,0]),
            xlim: chart_opts.xlim,
            ylim: chart_opts.ylim,
            data_xlim: [0,1],
            data_ylim: [0,1],
            padding: padding,
            svg: svg,
            chartarea: chartarea,
            counter: d3po.counter(),
            chart_opts:chart_opts
        };

        // set viewport to data on reset
        update_viewport = function() {

            var data_width = chart_data.data_xlim[1]-chart_data.data_xlim[0],
                data_height = chart_data.data_ylim[1]-chart_data.data_ylim[0];

            chart_data.xscale.domain([chart_data.data_xlim[0] -
                                      chart_data.padding*data_width,
                                      chart_data.data_xlim[1] +
                                      chart_data.padding*data_width
                                    ]);
            chart_data.yscale.domain([chart_data.data_ylim[0] -
                                      chart_data.padding*data_height,
                                      chart_data.data_ylim[1] +
                                      chart_data.padding*data_height
                                    ]);

            if(chart_data.zoom) {
                chart_data.zoom
                         .x(chart_data.xscale)
                         .y(chart_data.yscale);
            }
            if(chart_data.xAxis) {
                chart_data.svg.select('.x.axis').call(chart_data.xAxis);
            }
            if(chart_data.yAxis) {
                chart_data.svg.select('.y.axis').call(chart_data.yAxis);
            }

            d3po.dispatch.update();
        };
        d3po.dispatch.on("reset."+chart_opts.name,update_viewport);

        svg.on({
            "mouseover": function() { d3po.curr_chart = chart_data; }
            });
        // add stuff unless asked not to
        chart_opts.axis && axis(chart_opts.axis_chart_opts);
        chart_opts.grid && grid(chart_opts.grid_chart_opts);
        chart_opts.zoom && zoom(chart_opts.zoom_chart_opts);
        console.log(chart_opts.tooltips);
        chart_opts.tooltips && tooltips(chart_opts.tooltip_chart_opts);
        chart_opts.hotkeys && hotkeys();

    };

    init();

    return {lines:lines,
            scatter:scatter,
            boxes:boxes,
            bars:bars,
            axis:axis
           };
};
