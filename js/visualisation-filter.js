// (It's CSV, but GitHub Pages only gzip's JSON at the moment.)
d3.csv("data/projects-1.0.csv", function(error, projects) {

  // Various formatters.
  var formatNumber = d3.format(",d"),
      dateParser = d3.time.format("%d/%m/%Y"),
      formatDate = d3.time.format("%d %B %Y"),
      formatCurrencyFormatter = d3.format(",.##");

  var nestByAgency = d3.nest().key(function (d) { return d.agencyName; });

  var projectListStep = 1;

  // A little coercion, since the CSV is untyped.
  var projectsRemove = [];
  projects.forEach(function(d, i) {
    d.index = i;
    if ((""+d.startDate).length > 0 && (""+d.completionDate).length > 0) {
      d.startDate = dateParser.parse(d.startDate);
      d.completionDate = dateParser.parse(d.completionDate);
    } else {
      projectsRemove.push(d);
    }
  });
  if (projectsRemove.length > 0) {
    // Remove the projects we planned to remove
    var removedCount = 0;
    projectsRemove.forEach(function (project) {
      projects.splice(project.index - removedCount, 1);
      removedCount++;
    });
  }



  // Create a list of agencies
  var agencies = new Array();
  projects.forEach(function (p, i) {
    if (!(agencies.indexOf(p.agencyName) >= 0)) {
      agencies.push(p.agencyName);
    }
  });
  agencies.sort();

  // Create the crossfilter for the relevant dimensions and groups.
  var project = crossfilter(projects),
      all = project.groupAll(),
      agency = project.dimension(function (d) { return d.agencyName; }),
      start = project.dimension(function (d) { return d.startDate; }),
      starts = start.group(d3.time.day),
      startsDomain = [d3.time.month.offset(start.bottom(1)[0].startDate, -6), d3.time.month.offset(start.top(1)[0].startDate, 6)],
      cost = project.dimension(function (d) { return parseFloat(d.plannedCost); }),
      costs = cost.group(),
      costsDomain = [0, Math.ceil(cost.top(1)[0].plannedCost) * 1.05],
      completion = project.dimension(function (d) { return d.completionDate; }),
      completions = completion.group(d3.time.day),
      completionsDomain = [d3.time.month.offset(completion.bottom(1)[0].completionDate, -6), d3.time.month.offset(completion.top(1)[0].completionDate, 6)];


  var charts = [
    barChart()
        .dimension(cost)
        .group(costs)
      .x(d3.scale.linear()
        .domain(costsDomain)
        .rangeRound([0, 1000])),

    barChart()
        .dimension(start)
        .group(starts)
        .round(d3.time.day.round)
      .x(d3.time.scale()
        .domain(startsDomain)
        .rangeRound([0, 1000])),

    barChart()
        .dimension(completion)
        .group(completions)
        .round(d3.time.day.round)
      .x(d3.time.scale()
        .domain(completionsDomain)
        .rangeRound([0, 1000]))
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

  // Render the initial lists.
  var list = d3.selectAll(".list")
      .data([projectList])
      .on("scroll", function (t) {
        var elm = d3.select(".list")[0][0];
        var maxheight = 400;
        // console.log(elm.scrollHeight + " == " + (elm.scrollTop + maxheight));
        if (elm.scrollHeight == (elm.scrollTop + maxheight)) {
          projectListStep++;
          list.each(render);
        }
      });

  // Render the total.
  d3.selectAll("#total")
      .text(formatNumber(project.size()));

  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    projectListStep = 1;
    chart.each(render);
    list.each(render);
    d3.select(".list")[0][0].scrollTop = 0;
    d3.select("#active").text(formatNumber(all.value()));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function projectList(div) {
    var projectList = nestByAgency.entries(agency.bottom(30 * projectListStep)); // d3.select(this).selectAll(".project").data(start.top(40 * projectListStep));


    div.each(function(d, i) {
      // Agency title first
      var agency = d3.select(this).selectAll(".agency")
                              .data(projectList, function (d) { return d.key; });

      agency.enter().append("div")
                  .attr("class", "agency")
                .append("div")
                  .attr("class", "name")
                  .text(function (d) { return d.values[0].agencyName; });

      agency.exit().remove();


      // Go through projects belonging to agency & render row
      var projectListItem = agency.order().selectAll(".project")
                                        .data(function (d) { return d.values; }, function (d) { return d.index; });

      var projectListElem = projectListItem.enter().append("div")
                                                .attr("class", "project");

      projectListElem.append("div")
        .attr("class", "name")
        .text(function (d) { return d.projectName; });

      projectListElem.append("div")
        .attr("class", "date start")
        .text(function (d) { return formatDate(d.startDate); });

      projectListElem.append("div")
        .attr("class", function (d) { return "date completion " + classForVariance(d.scheduleVariancePercent); })
        .text(function (d) { return formatDate(d.completionDate); });

      projectListElem.append("div")
        .attr("class", "cost planned")
        .text(function (d) { return formatCurrency(d.plannedCost); });

      projectListElem.append("div")
        .attr("class", function (d) { return "cost completion " + classForVariance(d.costVariancePercent); })
        .text(function (d) { return formatCurrency(d.projectedActualCost); });

      // projectListElem.append("div")
      //   .attr("class", "date completion")
      //   .text(function (d) { return formatCurrency(d.projectedActualCost); });

      projectListItem.exit().remove();
      projectListItem.order();





      function formatCurrency(value) {
        return "$" + formatCurrencyFormatter(value) + "m";
      }

      function classForVariance(variance) {
        variance = parseFloat(variance);
        if (variance > 0) {
          return "positive";
        } else if (variance < 0) {
          return "negative";
        }
        return "";
      }
    });
  }

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
});