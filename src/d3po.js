var d3po = window.d3po || {
    version: '0.1.1',
    chartcount: 0,
    // this keeps track of one chart globally for routing keystroke events etc.
    curr_chart: null
    };

if(d3po.css === undefined) {

    // this gets added to the DOM for every chart call, but meh...
    d3po.css = 'svg { font: 10px sans-serif; }' +
               '.axis path { fill: none; stroke: #333; }' +
               '.axis line { fill: none; stroke: #999; stroke-dasharray: 2,2; }' +
               '.label { color: black; }';

    var d3poStyle = document.createElement("style");
    d3poStyle.type = "text/css";
    d3poStyle.innerHTML = d3po.css;
    document.getElementsByTagName("head")[0].appendChild(d3poStyle);

    window.d3po = d3po;
}

d3po.util = {
    transform: function(transf,elem) {
        "use strict";
        var trans = d3.transform(elem?d3.select(elem).attr("transform"):null),
            k;
        for(k in transf) {
            trans[k] = transf[k];
        }
        return trans.toString();
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
                    fill: colors[i%colors.length],
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

    var chart_opts = {},
        chart_data = {},
        lines,
        scatter,
        boxes,
        heatmap,
        bars,
        axis,
        grid,
        zoom,
        legend,
        tooltips,
        hotkeys,
        controls,
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
       chart_data.dispatch.on("update."+chart_opts.name+"."+id,update_lines);
       chart_data.dispatch.update();
       chart_data.dispatch.reset();
    };

    scatter = function(data,scatter_opts) {
        var sopts = scatter_opts || {},
            id = "scatter_"+chart_data.counter.inc('scatter'),
            size_min, size_max, size_scale,
            xExtent, yExtent,
            points, update_points;

        sopts = {
                   scale_mode: sopts.scale_mode || "median"
                };

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
                    mouseover:chart_data.dispatch.mouseover,
                    mouseout:chart_data.dispatch.mouseout
                  });

        update_points = function() {

              points.attr({
                        d: function(d) {
                            return d3.svg.symbol()
                                         .type(d.shape)
                                         .size(size_scale(d.size || 30))();
                        },
                        transform: function(d) {
                            var transf = {};
                            transf.translate = [chart_data.xscale(d.x),
                                                chart_data.yscale(d.y)];
                            if(d3.event && d3.event.scale &&
                               chart_opts.zoom_opts &&
                               chart_opts.zoom_opts.geometric) {
                                transf.scale = d3.event.scale;
                            }
                            return d3po.util.transform(transf,this);
                        }
                      })
                      .style({
                        fill: function(d) { return d.fill || 'blue'; },
                        "fill-opacity": function(d) { return d.alpha; }
                     });

        };
        chart_data.dispatch.on("update."+id,update_points);
        chart_data.dispatch.update();
        chart_data.dispatch.reset();

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
                    mouseover:chart_data.dispatch.mouseover,
                    mouseout:chart_data.dispatch.mouseout
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
                            var transf = {},
                                dims = get_dims(d);
                            if(bopts.anchor == "center") {
                                transf.translate =
                                        [chart_data.xscale(d.x)-dims[0]/2,
                                         chart_data.yscale(d.y)-dims[1]/2];
                            }
                            else {
                                transf.translate =
                                        [chart_data.xscale(d.x),
                                         chart_data.yscale(d.y)-dims[1]];
                            }
                            return d3po.util.transform(transf,this);
                        }

                    })
                    .style({
                        fill: function(d) { return d.fill || 'blue'; },
                        stroke: function(d) { return d.stroke || 'none'; },
                        "fill-opacity": function(d) { return d.alpha; }
                     });

        };
        chart_data.dispatch.on("update."+id,update_boxes);
        chart_data.dispatch.update();
        chart_data.dispatch.reset();

    };

    heatmap = function(data,heatmap_opts) {
        var hopts = heatmap_opts || {},
            colormap,
            color_scale,
            y_extents,
            data_extents,
            new_data;

        hopts = {
            colors: hopts.colors || ['white','#441100']
        }
        colormap = d3.interpolateRgb(hopts.colors[1],hopts.colors[0])
        y_extents = d3.extent(data,function(d) { return d.y; });
        data_extents = d3.extent(data,function(d) { return d.v; });
        color_scale = d3.scale.linear()
                        .range([0,1])
                        .domain(data_extents);

        new_data = data.map(function(d) {
            d.y = y_extents[1]-d.y+y_extents[0];
            d.fill = colormap(color_scale(d.v));
            d.w = 1;
            d.h = 1;
            return d;
        })

        boxes(new_data);
    };

    bars = function() {
        console.log('not implemented yet');
    };

    axis = function(axis_opts) {
        var aopts = axis_opts || {},
            xAxis, yAxis,
            xAxis_g, yAxis_g;

        aopts = {
            aspect: aopts.aspect || undefined,
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
        xAxis_g = chart_data.svg
                  .insert("g","#chartarea")
                  .attr({
                      "transform":d3po.util.transform({
                              translate: [
                                chart_opts.margin.left,
                               (chart_opts.margin.top +
                                chart_data.chart_height)
                              ]
                          },
                          this),
                      "class":"x axis"
                   })
                  .call(xAxis);

        yAxis_g = chart_data.svg
                   .insert("g","#chartarea")
                   .attr({
                        "class": "y axis",
                        "transform":d3po.util.transform({
                            translate: [chart_opts.margin.left,
                                        chart_opts.margin.top]
                         },
                         this)
                    })
                   .call(yAxis);

        // add x and y labels if set
        if(aopts.xLabel) {
            xAxis_g.append("text")
                   .attr({
                          "class": "x label",
                          "text-anchor": "middle",
                          transform :d3po.util.transform({
                               translate: [chart_data.chart_width/2, 25]
                           },
                           this)
                         })
                   .text(aopts.xLabel);
        }
        if(aopts.yLabel) {
            yAxis_g.append("text")
                   .attr({
                          "class": "x label",
                          "text-anchor": "middle",
                          transform :d3po.util.transform({
                               translate: [-25,chart_data.chart_height/2],
                               rotate: -90
                           },
                           this)
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

        // zoom is currently only implemented when axis is on
        if(chart_opts.axis) {
            chart_opts.zoom_opts = zopts;
            zoomed = function() {
                // we check for chart_opts.zoom here so we can turn zooming on
                // and off on the fly
                if(chart_opts.zoom) {
                    chart_data.svg.select(".x.axis").call(chart_data.xAxis);
                    chart_data.svg.select(".y.axis").call(chart_data.yAxis);
                    chart_data.dispatch.update();
                }
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
                 offset: topts.offset == undefined ?  10 : topts.offset,
                 ignore: topts.ignore || ['fill','stroke','w','h','shape','alpha'],
                 only: topts.only || undefined
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

            var tooltip_rect,
                path = d3.select(this);

            // animate stroke on mouseover
            path.attr({
                     "stroke-dasharray": "10,2",
                    })
              .style("stroke",function(d) { return d.stroke || "#9696ff"; })
              .append("animate")
              .attr({
                     attributeName:"stroke-dashoffset",
                     begin:"0s",
                     from:0,
                     to:100,
                     dur:"10s",
                     repeatCount:"indefinite"
                    });

            path.append("animate")
                .attr({
                     attributeName:"stroke-width",
                     begin:"0s",
                     from: "1px",
                     to: "3px",
                     dur:"1s",
                     restart: "always",
                     fill: "freeze"
                    });

            tooltip_g.selectAll("text")
                     .data(d3.entries(d).filter(function(v) {
                        if(topts.only != undefined) {
                            return topts.only.indexOf(v.key) != -1;
                        }
                        return topts.ignore.indexOf(v.key) == -1;
                       }))
                     .enter()
                     .append("text")
                     .attr({
                        x: 5,
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
                        width: tooltip_rect.width+10,
                        height: tooltip_rect.height+10,
                        rx:5,
                        ry:5
                      });

            // figure out where to put the tooltip
            tooltip_rect.x = chart_data.xscale(d.x)+
                             chart_opts.margin.left+
                             topts.offset;

            tooltip_rect.y = chart_data.yscale(d.y)+
                             chart_opts.margin.top+
                             topts.offset;

            if(tooltip_rect.x+tooltip_rect.width > chart_opts.width) {
                tooltip_rect.x = chart_data.xscale(d.x)+
                                 chart_opts.margin.left-
                                 tooltip_rect.width-topts.offset;
            }
            if(tooltip_rect.y+tooltip_rect.height > chart_opts.height) {
                tooltip_rect.y = chart_data.yscale(d.y) +
                                 chart_opts.margin.top -
                                 tooltip_rect.height -
                                 topts.offset;
            }
            tooltip_g.attr({
                            transform: function() {
                                var transf = {};
                                transf.translate = [tooltip_rect.x,
                                                    tooltip_rect.y];
                                if(d3.event && d3.event.scale &&
                                   chart_opts.zoom_opts &&
                                   chart_opts.zoom_opts.geometric) {
                                    transf.scale = d3.event.scale;
                                }
                                return d3po.util.transform(transf,this);
                            }
                          })
                     .attr({
                            opacity: 1
                           });
        };

        chart_data.dispatch.on("mouseover."+chart_opts.name+".tooltip",
                         update_tooltip);

        hide_tooltip = function() {

            // remove the animated stroke
            d3.select(this)
              .attr({
                     "stroke-dasharray": null
                    })
               .style({
                   fill: function(d) { return d.fill || 'blue'; },
                   stroke: function(d) { return d.stroke || 'none'; },
                   "stroke-width" : "1px",
                   "fill-opacity": function(d) { return d.alpha; }
               });

            d3.select(this)
              .selectAll("animate")
              .remove();

            tooltip_g.attr({
                            opacity: 0
                           });
            tooltip_g.selectAll("text").remove();
            tooltip_g.selectAll("rect").remove();
        };
        chart_data.dispatch.on("mouseout."+chart_opts.name+".tooltip",
                         hide_tooltip);

    };

    hotkeys = function() {
        console.log('not implemented yet');
    };

    controls = function() {

        // reset buttom
        d3.select(chart_opts.target)
                  .append("button")
                  .text("Reset")
                  .on("click",function() {
                        chart_data.dispatch.reset();
                    });

        // zoom toggle
        //FIXME: toggling zoom on and off prevents scroll events from passing
        // through to the browser so you have to scroll off of the chart
        d3.select(chart_opts.target)
            .append("label")
                .text("Zoom")
                .attr('for',chart_opts.name+'_zoom')
            .append("input")
                .attr("type","checkbox")
                .attr("id",chart_opts.name+'_zoom')
                .call(function() {
                    if(chart_opts.zoom) {
                        this.node().checked = true;
                    }
                 })
                .on("click",function() {

                    if(chart_opts.zoom == undefined) {
                        chart_opts.zoom = false;
                    }
                    if(!chart_data.zoom) {
                        zoom(chart_opts.zoom_opts);
                    }

                    chart_opts.zoom = !chart_opts.zoom;

                });
    }

    // set everything up
    init = function() {

        var svg,
            defs,
            chart_width, chart_height,
            chartarea, this_chart,
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
            zoom: opts.zoom == true ? opts.zoom : false,
            zoom_opts: opts.zoom_opts || {},
            tooltips: opts.tooltips == false ? opts.tooltips : true,
            tooltips_opts: opts.tooltips_opts || {},
            hotkeys: opts.hotkeys == false ? opts.hotkeys : true,
            controls: opts.contols == false ? opts.controls : true
        };

        if(chart_opts.width == 'fill') {
            chart_opts.width = d3.select(chart_opts.target)
                                 .node()
                                 .getBoundingClientRect().width;
        }
        if(chart_opts.height == 'fill') {
            chart_opts.height = d3.select(chart_opts.target)
                                 .node()
                                 .getBoundingClientRect().height;
        }

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
                            transform: d3po.util.transform({
                                         translate: [chart_opts.margin.left,
                                                     chart_opts.margin.top]
                                        })
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

        // we create a d3.dispatch object with events for this specific chart
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
            dispatch: d3.dispatch("update","reset","mouseover","mouseout")
        };

        // set viewport to data on reset
        update_viewport = function() {

            var xlim = chart_data.data_xlim,
                ylim = chart_data.data_ylim,
                data_width = chart_data.data_xlim[1]-chart_data.data_xlim[0],
                data_height = chart_data.data_ylim[1]-chart_data.data_ylim[0],
                tmp,
                aspect = 1;

            // set the aspect of the scales here if set
            if(chart_opts.axis_opts &&
               chart_opts.axis_opts.aspect) {
                if(chart_opts.axis_opts.aspect == "equal") {
                    if(data_width > data_height) {
                        tmp = data_width*chart_opts.height/chart_opts.width;
                        ylim[0] = ylim[0]-(tmp-data_height)/2;
                        ylim[1] = ylim[1]+(tmp-data_height)/2;
                        data_height = tmp;

                    } else {
                        tmp = data_height*chart_opts.width/chart_opts.height;
                        xlim[0] = xlim[0]-(tmp-data_width)/2;
                        xlim[1] = xlim[1]+(tmp-data_width)/2;
                        data_width = tmp;
                    }
                }
            }
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

            chart_data.dispatch.update();
        };
        chart_data.dispatch.on("reset."+chart_opts.name,update_viewport);

        // this changes the static variable for curr chart to this chart
        // on mouseover
        svg.on({
            "mouseover": function() {
                d3po.curr_chart = {chart_data:chart_data,chart_opts:chart_opts};
              },
            "click": function() {
                d3po.curr_chart = {chart_data:chart_data,chart_opts:chart_opts};
              }

            });
        // add stuff unless asked not to
        chart_opts.axis && axis(chart_opts.axis_opts);
        chart_opts.grid && grid(chart_opts.grid_opts);
        chart_opts.zoom && zoom(chart_opts.zoom_opts);
        chart_opts.tooltips && tooltips(chart_opts.tooltip_opts);
        // not working yet
        //chart_opts.hotkeys && hotkeys();
        chart_opts.controls && controls();

    };

    init();

    return {lines:lines,
            scatter:scatter,
            boxes:boxes,
            heatmap:heatmap,
            bars:bars
            //axis:axis,
            //chart_data: chart_data,
            //opts: chart_opts,
            //init:init
           };
};
