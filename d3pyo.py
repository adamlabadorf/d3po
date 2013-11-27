import json

VERSION = "0.3.4"

JS = """\
<div id="%(name)s">
</div>
<script type="text/javascript">
    var intId_%(name)s = window.setInterval(
    function() {
        try {
            d3;
            d3po;

            var chart, data;
            chart = d3po.chart(
                %(chart_opts)s
                );
            %(content)s

            window.clearInterval(intId_%(name)s);
        } catch(e) {
            console.log('not loaded yet: '+e);
        }
    },500);
</script>
"""

def d3po_init() :
    return """\
    <div id="d3po_init">
        d3pyo v%(version)s<br/>
    </div>
    <script language="JavaScript">
    function loadJS(src) {
        var oHead = document.getElementsByTagName('HEAD').item(0);
        var oScript= document.createElement("script");
        oScript.type = "text/javascript";
        oScript.src=src;
        oHead.appendChild( oScript);
        
    };

    try { d3; console.log("d3 loaded"); }
    catch(e) {
        console.log("loading d3");
        loadJS("http://d3js.org/d3.v3.min.js");
    }

    try { d3po; console.log("d3po loaded"); }
    catch(e) {
        console.log("loading d3po");
        loadJS("http://adamlabadorf.github.io/d3po/d3po.js");
    }

    var intId_init = window.setInterval(
    function() {
        try {
            d3po;
            document.getElementById("d3po_init").innerHTML += "d3po v"+d3po.version;
            window.clearInterval(intId_init);
        } catch(e) {
            console.log(e);
        }
    },500);
    </script>"""%{'version':str(VERSION)}

class Chart(object) :

    chart_no = 0

    def __init__(self,chart_opts) :
        self.chart_opts = chart_opts
        self.name = chart_opts.get('name')
        if not self.name :
            self.name = 'chart_%d'%Chart.chart_no
            Chart.chart_no += 1
        self.chart_opts['target'] = '#'+self.name
        self._js = []
        self.series_no = 0

    def add_series(self,kind,data,opts=None) :
        if not opts :
            opts = {}
        js_d = {'kind':kind,
                'n': self.series_no,
                'data': json.dumps(data),
                'opts': json.dumps(opts)
               }

        js = ("var data_%(n)d = %(data)s;\n"+
              "chart.%(kind)s(data_%(n)d,%(opts)s);")%js_d
        self._js.append(js)
        self.series_no += 1
        self._build()

    def scatter(self,data,opts=None) :
        self.add_series('scatter',data,opts)
    def lines(self,data,opts=None) :
        self.add_series('lines',data,opts)
    def boxes(self,data,opts=None) :
        self.add_series('boxes',data,opts)
    def heatmap(self,data,opts=None) :
        self.add_series('heatmap',data,opts)

    def _build(self) :
        self.js = JS%{
                      'chart_opts':json.dumps(self.chart_opts),
                      'content':'\n'.join(self._js),
                      'name':self.name
                     }

    def __str__(self) :
        return self.js

    def __repr__(self) :
        return self.js
