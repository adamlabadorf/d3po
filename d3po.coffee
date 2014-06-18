( ->

	d3 = null
	if typeof require == 'function' and define.amd
		d3 = require("d3")
	else
		d3 = window.d3
	
	d3po =
		version: "0.2"
		chartcount: 0
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
		counter: ->
			counts = {}
			r =
				get: (key) -> counts[key]
				inc: (key) -> counts[key] = counts[key]+1 or 0

	d3po.randomScatter = (points = 10)->
		f = (i) ->
			 x: d3.random.normal
			 y: d3.random.normal
			 size: Math.random
			 shape: d3po.shapes[i%%d3po.shapes.length]
			 fill: d3po.colors[i%%d3po.colors.length]
			 alpha: Math.min(1,0.5+Math.random())
		f(i) for i in [0..points-1]

	d3po.randomLine = (points = 15)->
		x = ( d3.random.normal()() for i in [0..points-1] )
		y = ( d3.random.normal()() for i in [0..points-1] )
		x.sort (a,b) -> a-b
		console.log x, y
		(->
			x:x[i]
			y:y[i]
		)() for i in [0..points-1]

	d3po.randomBoxes = (boxes = 20)->
		f = (i) ->
			x: Math.random(), y: Math.random()
			w:100*Math.max(0.1,d3.random.normal(1)())
			h:100*Math.max(0.1,d3.random.normal(1)())
			fill: colors[i%%colors.length]
			stroke: colors[(i+3)%colors.length]
			alpha: Math.min(1,0.5+Math.random())
		f(i) for i in [0..boxes-1]

	d3po.randomBoxGrid = (rows = 10, cols = 10)->
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

	# main chart function
	d3po.chart = (opts = {}) ->
		
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

		opts[k]? or opts[k] = v for k, v of defaults

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
			.attr
				x:0
				y:0
				width:chart_width
				height:chart_height

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
			.attr
				width: chart_width,
				height: chart_height,
				opacity: 0

		# padding adds space around data limits
		padding = switch
			when opts.padding == "none" then 0
			when opts.padding == "tight" then 0.01
			else 0.05
		
		my = () ->
			@

		props =
			svg: svg
			chart_width: chart_width
			chart_height: chart_height
			xscale: d3.scale.linear().domain([0,1]).range([0,chart_width])
			yscale: d3.scale.linear().domain([0,1]).range([chart_height,0])
			opts: opts
			counter: d3po.counter()
			lines: d3po.chart.lines
			axis: d3po.chart.axis
			chartarea: chartarea
			xlim: opts.xlim
			ylim: opts.ylim
			data_xlim: [0,1]
			data_ylim: [0,1]
			padding: padding
			dispatch: d3.dispatch("update","reset","mouseover","mouseout")

		my[k] = v for k,v of props
		
		# set viewport to data on reset
		update_viewport = ->

			xlim = my.data_xlim
			ylim = my.data_ylim
			data_width = my.data_xlim[1] - my.data_xlim[0]
			data_height = my.data_ylim[1] - my.data_ylim[0]
			aspect = 1

			#set the aspect of the scales here if set
			if opts.axis_opts and opts.axis_opts.aspect
				if chart_opts.axis_opts.aspect == "equal"
					if data_width > data_height
						tmp = data_width * opts.height / opts.width
						ylim[0] = ylim[0] - (tmp-data_height) / 2
						ylim[1] = ylim[1] + (tmp-data_height) / 2
						data_height = tmp
					else
						tmp = data_height * pts.width / opts.height
						xlim[0] = xlim[0] - (tmp-data_width) / 2
						xlim[1] = xlim[1] + (tmp-data_width) / 2
						data_width = tmp

			my.xscale.domain [my.data_xlim[0] - my.padding*data_width,
							my.data_xlim[1] + my.padding*data_width ]
			my.yscale.domain [my.data_ylim[0] - my.padding*data_height,
							my.data_ylim[1] + my.padding*data_height ]

			if my.zoom
				my.zoom
					.x my.xscale
					.y my.yscale

			if my.xAxis
				my.svg
					.select '.x.axis' 
					.call my.xAxis
			if my.yAxis
				my.svg
					.select '.y.axis'
					.call my.yAxis

			my.dispatch.update();

		my.dispatch.on "reset."+opts.name, update_viewport

		# turn things on
		opts.axis and my.axis()

		getsetter_fields = ["height","width"]
		getsetter = (field) ->
		  (v) ->
			  if v? then @opts[field] = v else return @opts[field]
			  my
		my[k] = getsetter(k) for k in getsetter_fields

		return my

	d3po.chart.axis = (opts = {}) ->

		opts?[k] or opts[k] = @opts.axis_opts[k] for k,v of @opts.axis_opts
		x_axis = d3.svg
				   .axis()
				   .scale @xscale
				   .orient "bottom"
				   .tickSize -@chart_height

		y_axis = d3.svg
				   .axis()
				   .scale @yscale
				   .orient "left"
				   .tickSize -@chart_width

		x_g = @svg
			.insert "g", "#chartarea"
			.attr
				transform: d3po.util.transform
					translate: [ @opts.margin.left, (@opts.margin.top + @chart_height) ]
					null
				class: "x axis"
			.call(x_axis)

		y_g = @svg
			.insert "g", "#chartarea"
			.attr
				transform: d3po.util.transform
					translate: [ @opts.margin.left, @opts.margin.top ]
					null
				class: "y axis"
			.call(y_axis)

		if opts.x_label
			x_g.append("text")
				.attr
					class: "x label",
					"text-anchor": "middle",
					transform: d3po.util.transform
						translate: [ @chart_width / 2, 25]
						this
				.text opts.x_label

		if opts.y_label
			y_g.append("text")
				.attr(
					class: "y label",
					"text-anchor": "middle",
					transform: d3po.util.transform(
						translate: [ -25, @chart_height / 2 ]
						rotate: -90,
						this
					)
				 )
				.text(opts.y_label)

		@x_axis = x_axis
		@y_axis = y_axis
	
	d3po.chart.lines = (data, line_opts = {}) ->

		console.log data[data.length-1]
		defaults =
			color: "black"
			stroke_width: 1
			extend_edges: false

		line_opts[k]? or line_opts[k] = v for k, v of defaults
		id = "line_"+@counter.inc("line")

		line_p = @chartarea
			.append "g"
			.attr { id: id }
			.append "path"
			.data data
		lines_this = @
		line_g = d3.svg.line()
			.x (d) -> lines_this.xscale d.x
			.y (d) -> lines_this.yscale d.y

		xExtent = d3.zip @data_xlim, d3.extent(data, (d) -> d.x)
		@data_xlim = [ d3.min(xExtent[0]), d3.max(xExtent[1]) ]

		yExtent = d3.zip @data_ylim, d3.extent(data, (d) -> d.y)
		@data_ylim = [ d3.min(yExtent[0]), d3.max(yExtent[1]) ]

		@update_lines = ->
			if line_opts.extend_edges
				f = (p1,p2,x) ->
					m = (p1.y-p2.y) / (p1.x-p2.x)
					b = p1.y - m*p1.x
					return m*x+b

				x = lines_this.xscale.domain()[0]
				o1 = { x: x, y: f data[0], data[1], x }

				p1 = data[data.length-2]
				p2 = data[data.length-1]
				x = lines_this.xscale.domain()[1]
				o2 = { x: x, y:f p1, p2, x }

				data = [o1].concat(data).concat([o2])

			line_p.attr
				d: line_g(data)
				stroke: line_opts.color
				"stroke-width": line_opts.stroke_width
				fill: "none"

		@dispatch.on "update."+@name+"."+id, @update_lines
		@dispatch.update()
		@dispatch.reset()
		null

	if typeof define == "function" and define.amd
		define(d3po)
		console.log "found RequireJS and AMD, defining d3po"
	else if typeof exports != "undefined" and typeof module != "undefined"
		module.exports = d3po
		console.log "found CommonJS module, exporting d3po"
	else
		this.d3po = d3po
		console.log "found global namespace, setting window.d3po"
	return
)()