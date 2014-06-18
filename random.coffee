(->
    d3po.randomScatter ->
        points = 10
        f = (i) ->
             x: d3.random.normal
             y: d3.random.normal
             size: Math.random
             shape: d3po.shapes[i%%d3po.shapes.length]
             fill: d3po.colors[i%%d3po.colors.length]
             alpha: Math.min(1,0.5+Math.random())
        f(i) for i in [1..points]

    d3po.randomLine ->
        points = 15
        x = ( d3.random.normal()() for i in [1..15] )
        y = ( d3.random.normal()() for i in [1..15] )
        x.sort (a,b) -> a-b
        (->
            x:x[i]
            y:y[i]
        )() for i in [1..points]

    d3po.randomBoxes ->
        boxes = 20
        f = (i) ->
            x: Math.random(), y: Math.random()
            w:100*Math.max(0.1,d3.random.normal(1)())
            h:100*Math.max(0.1,d3.random.normal(1)())
            fill: colors[i%%colors.length]
            stroke: colors[(i+3)%colors.length]
            alpha: Math.min(1,0.5+Math.random())
        f(i) for i in [1..points]

    d3po.randomBoxGrid ->
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
		
)(d3po || {})
