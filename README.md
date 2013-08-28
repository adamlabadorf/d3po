d3po
====

Yet another Javascript library for making d3 charts. After playing with
[nvd3](http://nvd3.org) I found it wasn't quite as usable as I would like,
e.g. it wasn't very easy to add both points and lines to the same chart.
This library works as follows:

    var chart = d3po.chart();
    chart.lines([{x:[0,1,2,3,4,5],y:[3,2,5,1,2,4],color:'blue'}])
    chart.points([{x:0,y:3.1,size:3,color:'blue'},{x:0.5,y:2.5,size:5,color:'red'}])
    chart.show();

I wanted a charting library that 'just works', like those you find in R or python.
Flexible where it needs to be, unobtrusive API that is amenable to embedding
in other settings (e.g. [IPython notebook](http://ipython.org/notebook.html)),
with helpful interactivity.

Dependencies
------------

[jQuery](http://jquery.com) and [d3](http://d3js.org).

Work in progress
----------------

Implemented:

    - charting area
    - axes
    - d3.svg.zoom functionality by default (can be turned off)

Still lots of features to implement:

    - erm, basic plotting functionality...
    - custom tool tips, with embeddable charts in them
    - chart controls (e.g. generic search, toggling of different series, et c)
    - documentation (nvd3 is pretty bad about this as of this writing)
