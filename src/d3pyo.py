import json

JS = """\
<div id="%(name)s">
</div>
<script type="text/javascript" src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
<script type="text/javascript" src="http://adamlabadorf.github.io/lib/d3po.js" ></script>
<script type="text/javascript">
    setTimeout(function() {
            var chart, data;
            chart = d3po.chart(
                %(chart_opts)s
                );
            %(content)s
    },500); // need to wait a couple milliseconds while the DOM updates
</script>
"""

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
