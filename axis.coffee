d3po.chart.axis = (opts = {}) ->

    opts?[k] or opts[k] = @opts.axis_opts[k] for k,v of @opts.axis_opts
    x_axis = d3.svg
               .axis()
               .scale(@_props.xscale)
               .orient("bottom")
               .tickSize(-@_props.chart_height)

    y_axis = d3.svg
               .axis()
               .scale(@_props.yscale)
               .orient("left")
               .tickSize(-@_props.chart_width)

    x_g = @_props.svg
                 .insert("g","#chartarea")
                 .attr(
                    transform: d3po.util.transform(
                        translate: [ @opts.margin.left, (@opts.margin.top + @_props.chart_height) ],
                        this)
                    class: "x axis"
                  )
                 .call(x_axis)

    y_g = @_props.svg
                 .insert("g","#chartarea")
                 .attr(
                    transform: d3po.util.transform(
                        translate: [ @opts.margin.left, @opts.margin.top ],
                        this)
                    class: "y axis"
                  )
                 .call(y_axis)

    if opts.x_label
        x_g.append("text")
            .attr(
                class: "x label",
                "text-anchor": "middle",
                transform: d3po.util.transform(
                    translate: [ @_props.chart_width/2, 25],
                    this
                )
             )
            .text(opts.x_label)

    if opts.y_label
        y_g.append("text")
            .attr(
                class: "y label",
                "text-anchor": "middle",
                transform: d3po.util.transform(
                    translate: [ -25, @_props.chart_height/2 ]
                    rotate: -90,
                    this
                )
             )
            .text(opts.y_label)

    @_props.x_axis = x_axis
    @_props.y_axis = y_axis
