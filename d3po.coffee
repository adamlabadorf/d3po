window.d3po = window.d3po or
    version: '0.2',
    chartcount: 0,
    curr_chart: null

    css: """svg { font: 10px sans-serif; }
                  .axis path { fill: none; stroke: #333; }
                  .axis line { fill: none; stroke: #999; stroke-dasharray: 2,2;
                  .label { color: black; }'
                  """
    util:
        transform: (transf,elem) ->
            trans = d3.transform(elem)
            ( trans[k] = v ) for k, v of transf
            trans.toString()

    shapes: ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square']
    colors: ['red','blue','cyan','green','orange','black','purple']

    randomScatter: ->
        points = 10
        f = (i) ->
             x: d3.random.normal
             y: d3.random.normal
             size: Math.random
             shape: d3po.shapes[i%%d3po.shapes.length]
             fill: d3po.colors[i%%d3po.colors.length]
             alpha: Math.min(1,0.5+Math.random())
        f(i) for i in [1..points]

    randomLine: ->
        points = 15
        x = ( d3.random.normal()() for i in [1..15] )
        y = ( d3.random.normal()() for i in [1..15] )
        x.sort (a,b) -> a-b
        (->
            x:x[i]
            y:y[i]
        )() for i in [1..points]

    randomBoxes: ->
        boxes = 20
        f = (i) ->
            x: Math.random(), y: Math.random()
            w:100*Math.max(0.1,d3.random.normal(1)())
            h:100*Math.max(0.1,d3.random.normal(1)())
            fill: colors[i%%colors.length]
            stroke: colors[(i+3)%colors.length]
            alpha: Math.min(1,0.5+Math.random())
        f(i) for i in [1..points]

    randomBoxGrid: ->
        rows = 10
        cols = 10

        d = (i,j) ->
            w = Math.random
            r =
                 x:i
                 y:j
                 w:w
                 h:w
                 fill: d3po.colors[i%%d3po.colos.length]
                 stroke: colors[(i+3)%colors.length]
                 alpha: Math.min(1,0.5+Math.random())
        d(i,j) for i in [1..rows] for j in [1..cols]

    counter: ->
        counts = {}
        r =
            get: (key) -> counts[key]
            inc: (key) -> counts[key] = counts[key]+1 or 0

    chart: (opts = {}) ->
        defaults =
            height: 600
            width: 600
            margin: {top: 40, right:40, bottom: 40, left:40}
            name: "chart_"+d3po.chartcount
            target: "body"
            xlim: [0,1]
            ylim: [0,1]
            background: "#eee"
            axis: true
            axis_opts:
                aspect: null
                x_label: null
                y_label: null
                tick_size: 4
            padding: "normal"
            grid: true
            grid_opts: {}
            zoom: false
            zoom_opts: {}
            tooltips: true
            tooltips_opts: {}
            hotkeys: true
            conrols: true

        opts[k] or opts[k] = v for k, v of defaults

        if d3.select('#d3po_style').empty()
            d3poStyle = document.createElement "style"
            d3poStyle.id = "d3po_style"
            d3poStyle.type = "text/css"
            d3poStyle.innerHTML = d3po.css
            document.getElementsByTagName("head")[0].appendChild(d3poStyle)

        d3po.chartcount += 1

        chart_width = opts.width - opts.margin.left - opts.margin.right
        chart_height = opts.height - opts.margin.top - opts.margin.bottom

        svg = d3.select(opts.target)
                .append("svg")
                .attr(
                    width: opts.width
                    height: opts.height
                    id: opts.name
                 )


        defs = svg.append("defs")

        defs.append("clipPath")
            .attr({id:"chartarea_clip_"+opts.name})
            .append("rect")
            .attr({
                   x:0,
                   y:0,
                   width:chart_width,
                   height:chart_height
                  })

        svg.append("rect")
           .attr(
                x: opts.margin.left
                y: opts.margin.top
                width: chart_width
                height: chart_height
            )
           .style(
                fill: opts.background
            )

        chartarea = svg.append("g")
                       .attr(
                            id: "chartarea"
                            "clip-path":"url(#chartarea_clip_" + opts.name+")"
                            transform: d3po.util.transform(
                                 translate: [opts.margin.left, opts.margin.top]
                            )
                        )

        chartarea.append("rect")
                 .attr(
                        width: chart_width,
                        height: chart_height,
                        opacity: 0
                  )

        my = () ->
            @

        my._props =
            svg: svg
            chart_width: chart_width
            chart_height: chart_height
            xscale: d3.scale.linear().domain([0,1]).range([0,chart_width])
            yscale: d3.scale.linear().domain([0,1]).range([chart_height,0])

        my.opts = opts

        my.counter = d3po.counter()

        my.lines = d3po.chart.lines
        my.axis = d3po.chart.axis

        # turn things on
        opts.axis and my.axis()

        getsetter_fields = ["height","width"]
        getsetter = (field) ->
          (v) ->
              if v? then @opts[field] = v else return @opts[field]
              my
        my[k] = getsetter(k) for k in getsetter_fields

        return my
