## d3po

Yet another Javascript library for making d3 charts. After playing with
[nvd3](http://nvd3.org) I found it wasn't quite as usable as I would like,
e.g. it wasn't very easy to add both points and lines to the same chart.
This library works as follows:

    var chart = d3po.chart();
    chart.lines([{x:0,y:3},{x:2,y:5}],{stroke:'blue'}])
    chart.scatter([{x:0,y:3.1,size:3,fill:'blue'},{x:0.5,y:2.5,size:5,fill:'red'}]);

I wanted a charting library that 'just works', like those you find in R or python.
Flexible where it needs to be, unobtrusive API that is amenable to embedding
in other settings (e.g. [IPython notebook](http://ipython.org/notebook.html)),
with helpful interactivity.

[Examples](http://adamlabadorf.github.io/src/d3po/src/test.html)

[IPython notebook](http://nbviewer.ipython.org/url/adamlabadorf.github.io/src/d3po/src/d3po.ipynb)

[Documentation](https://github.com/adamlabadorf/d3po/wiki/Documentation)

# d3pyo

d3pyo is a python wrapper for generating d3po charts. I wrote it so I could put
d3po charts into ipython notebooks. You can use it like this (in an ipython notebook
block, last line has to be the HTML call):

    from random import random
    import urllib2
    from IPython.display import HTML
    exec urllib2.urlopen('http://adamlabadorf.github.io/src/d3po/src/d3pyo.py').read()
    # this initializes d3po and its dependencies, put before other calls
    HTML(d3po_init())

    # in a different box
    c = Chart({'name':'awesome_interactive_chart'})
    c.scatter([dict(x=random(),y=random(),size=random()) for _ in range(10)])
    HTML(c.js)

The python `Chart` class has all of the same methods exposed as the functions on the
`d3po.chart` object.

# Dependencies

[jQuery](http://jquery.com) and [d3](http://d3js.org).

# Work in progress

Implemented:

    - scatter
    - lines
    - boxes (heatmap primitive, bar charts)
    - heatmap
    - axes
    - tooltips on hover over points
    - d3 zoom behavior (can be turned off)
    - html-based controls

Still lots of features to implement:

    - boxplots
    - search feature
    - documentation (nvd3 is pretty bad about this as of this writing)
