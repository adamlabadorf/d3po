d3po.chart.heatmap = (data,opts) ->
    defaults =
        colors: ['white','#441100']
    opts[k] or opts[k] = defaults[k] for k,v of defaults

    colormap = d3.interpolateRgb(opts.colors[1],opts.colors[0])
    y_extents = d3.extent(data,(d) -> d.y)
    data_extents = d3.extent(data,(d) -> d.v )
    color_scale = d3.scale.linear().range([0,1]).domain(data_extents)
    f = (d) ->
        y: y_extents[1]-d.y+y_extents[0]
        fill: colormap(color_scale(d.v))
        w: 1
        h: 1
    boxes(f(d) for d in data)


