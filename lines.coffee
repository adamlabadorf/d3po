d3po.chart.lines = (data,opts) ->
    defaults =
        id: "line_"+@counter.inc "line"
    opts[k] or opts[k] = defaults[k] for k,v of defaults


