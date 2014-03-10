d3.csv("data/projects-1.0.csv", function(error, projects) {

	var myData = [{ "thedad": "Homer Simpson", "name": "Bart", "value": 20 },
{ "thedad": "Homer Simpson", "name": "Lisa", "value": 14 },
{ "thedad": "Homer Simpson", "name": "Maggie", "value": 6 },
{ "thedad": "Peter Griffin", "name": "Chris", "value": 19 },
{ "thedad": "Peter Griffin", "name": "Meg", "value": 12 },
{ "thedad": "Peter Griffin", "name": "Stewie", "value": 16 },
{ "thedad": "Bart", "name": "Bart Junior A", "value": 77 },
{ "thedad": "Bart", "name": "Bart Junior B", "value": 32 }];


	var margin = {top: 20, right: 0, bottom: 0, left: 0},
		width = 960,
		height = 500 - margin.top - margin.bottom,
		formatNumber = d3.format(",d"),
		transitioning;

	var x = d3.scale.linear()
		.domain([0, width])
		.range([0, width]);

	var y = d3.scale.linear()
		.domain([0, height])
		.range([0, height]);

	var treemap = d3.layout.treemap()
		.children(function(d, depth) { return depth ? null : d._children; })
		.sort(function(a, b) { return a.value - b.value; })
		.ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
		.round(false);

	var svg = d3.select("#treemap").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.bottom + margin.top)
		.style("margin-left", -margin.left + "px")
		.style("margin.right", -margin.right + "px")
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.style("shape-rendering", "crispEdges");

	var grandparent = svg.append("g")
		.attr("class", "grandparent");

	grandparent.append("rect")
		.attr("y", -margin.top)
		.attr("width", width)
		.attr("height", margin.top);

	grandparent.append("text")
		.attr("x", 6)
		.attr("y", 6 - margin.top)
		.attr("dy", ".75em");


	root = _.nest( projects, "agencyName");
	root.name = "Agencies";
	console.log( root );


	initialize(root);
	accumulate(root);
	layout(root);
	display(root);









	function initialize(root) {
		root.x = root.y = 0;
		root.dx = width;
		root.dy = height;
		root.depth = 0;

		root.children.forEach(function (a) {
			a.value = a.children.length/root.children.length;
			a.children.forEach(function (p) {
				p.value = 5; //formatNumber(p.lifecycleCost);
				p.name = p.projectName;
			});
		});
	}

	// Aggregate the values for internal nodes. This is normally done by the
	// treemap layout, but not here because of our custom implementation.
	// We also take a snapshot of the original children (_children) to avoid
	// the children being overwritten when when layout is computed.
	function accumulate(d) {
		return (d._children = d.children)
					? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
					: d.value;
	}

	// Compute the treemap layout recursively such that each group of siblings
	// uses the same size (1Ã—1) rather than the dimensions of the parent cell.
	// This optimizes the layout for the current zoom state. Note that a wrapper
	// object is created for the parent node for each group of siblings so that
	// the parentâ€™s dimensions are not discarded as we recurse. Since each group
	// of sibling was laid out in 1Ã—1, we must rescale to fit using absolute
	// coordinates. This lets us use a viewport to zoom.
	function layout(d) {
		if (d._children) {
			treemap.nodes({_children: d._children});
			d._children.forEach(function(c) {
				c.x = d.x + c.x * d.dx;
				c.y = d.y + c.y * d.dy;
				c.dx *= d.dx;
				c.dy *= d.dy;
				c.parent = d;
				layout(c);
			});
		}
	}

	function display(d) {
		grandparent
			.datum(d.parent)
			.on("click", transition)
			.select("text")
			.text(name(d));

		var g1 = svg.insert("g", ".grandparent")
			.datum(d)
			.attr("class", "depth");

		var g = g1.selectAll("g")
			.data(d._children)
			.enter().append("g");

		g.filter(function(d) { return d._children; })
			.classed("children", true)
			.on("click", transition);

		g.selectAll(".child")
			.data(function(d) { return d._children || [d]; })
			.enter().append("rect")
			.attr("class", "child")
			.call(rect);

		g.append("rect")
			.attr("class", "parent")
			.call(rect)
			.append("title")
			.text(function(d) { return formatNumber(d.value); });

		g.append("text")
			.attr("dy", ".75em")
			.text(function(d) { return d.name; })
			.call(text);

		function transition(d) {
			if (transitioning || !d) return;
			transitioning = true;

			var g2 = display(d),
			t1 = g1.transition().duration(750),
			t2 = g2.transition().duration(750);

			// Update the domain only after entering new elements.
			x.domain([d.x, d.x + d.dx]);
			y.domain([d.y, d.y + d.dy]);

			// Enable anti-aliasing during the transition.
			svg.style("shape-rendering", null);

			// Draw child nodes on top of parent nodes.
			svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

			// Fade-in entering text.
			g2.selectAll("text").style("fill-opacity", 0);

			// Transition to the new view.
			t1.selectAll("text").call(text).style("fill-opacity", 0);
			t2.selectAll("text").call(text).style("fill-opacity", 1);
			t1.selectAll("rect").call(rect);
			t2.selectAll("rect").call(rect);

			// Remove the old node when the transition is finished.
			t1.remove().each("end", function() {
				svg.style("shape-rendering", "crispEdges");
				transitioning = false;
			});
		}

		return g;
	}

	function text(text) {
		text.attr("x", function(d) { return x(d.x) + 6; })
			.attr("y", function(d) { return y(d.y) + 6; });
	}

	function rect(rect) {
		rect.attr("x", function(d) { return x(d.x); })
			.attr("y", function(d) { return y(d.y); })
			.attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
			.attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
	}

	function name(d) {
		return d.parent
					? name(d.parent) + "." + d.name
					: d.name;
	}

});





















// d3.csv("data/projects-1.0.csv", function(error, projects) {
// 	// Projects loaded. We have an array as 'projects'

// 	var canvasSize = {width:1000, height:800},
// 		formatNumber = d3.format(",d"),
// 		selectedAgency = null;

// 	var color = d3.scale.category20c();

// 	var treemap = d3.layout.treemap()
// 						.size([canvasSize.width, canvasSize.height])
// 						.sticky(true);

// 	var canvas = d3.select("#treemap").append("div")
// 								.style("position", "relative")
// 								.style("width", canvasSize.width)
// 								.style("height", canvasSize.height);


// 	// Gather information about agencies
// 	var agencies = new Array();
// 	projects.forEach(function(p, i) {
// 		var foundAgency = agencies.filter(function (agency) {
// 			return (agency.code == p.agencyCode);
// 		});

// 		// Retrieve/create agency
// 		var agency = null;
// 		if (foundAgency.length == 0) {
// 			// Add agency
// 			agency = {"name":p.agencyName, "code":p.agencyCode, "projectCount":0, "costMoreCount":0, "costLessCount":0, "scheduleMoreCount":0, "scheduleLessCount":0}
// 			agencies.push(agency);
// 		} else {
// 			// Agency existed
// 			agency = foundAgency[0];
// 		}

// 		// Update agency summary info
// 		agency.projectCount += 1;

// 		if (p.costVariance == 0) {
// 		} else if (p.costVariance > 0) {
// 			agency.costMoreCount += 1;
// 		} else {
// 			agency.costLessCount += 1;
// 		}

// 		if (p.scheduleVariance == 0) {
// 		} else if (p.scheduleVariance > 0) {
// 			agency.scheduleMoreCount += 1;
// 		} else {
// 			agency.scheduleLessCount += 1;
// 		}
// 	});

// 	agencies.sort(function(a, b) {
// 		if (a.name < b.name) return -1;
// 		if (b.name < a.name) return -1;
// 		return 0;
// 	});




// 	drawVisualisaton();



// 	function drawVisualisaton() {
// 		if (selectedAgency == null) {
// 			// Show agencies
// 			treemap.value(function (d) { return d.length; });

// 			var node = canvas.datum(agencies).selectAll(".node")
// 										.data(treemap.nodes)
// 									.enter().append("div")
// 										.attr("class", "node")
// 										.call(position)
// 										.style("background", function (d) { return color(d.name); })
// 										.style("border", function (d) { return "solid 1px black"; })
// 										.text(function (d) { return d.name; });


// 		} else {
// 			// Show projects for an agency
// 			var agencyProjects = projects.filter(function (project) {
// 				return (project.agencyCode == selectedAgency.code);
// 			});
// 		}





// 		function position() {
// 			this.style("left", function(d) { return d.x + "px"; })
// 				.style("top", function(d) { return d.y + "px"; })
// 				.style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
// 				.style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
// 		}
// 	}
// });



// d3.csv("data/projects-1.0.csv", function(error, root) {
// 	root = _.nest(root, "agencyName");
// 	console.log(root);

// 	var margin = {top: 40, right: 10, bottom: 10, left: 10},
// 	    width = 960 - margin.left - margin.right,
// 	    height = 500 - margin.top - margin.bottom;

// 	var color = d3.scale.category20c();

// 	var treemap = d3.layout.treemap()
// 	    .size([width, height])
// 	    .sticky(true)
// 	    .value(function(d) { console.log(d.length); return d.length; });

// 	var canvas = d3.select("body").append("div")
// 	    .style("position", "relative")
// 	    .style("width", (width + margin.left + margin.right) + "px")
// 	    .style("height", (height + margin.top + margin.bottom) + "px")
// 	    .style("left", margin.left + "px")
// 	    .style("top", margin.top + "px");

//   var node = canvas.datum(root).selectAll(".node")
//       .data(treemap.nodes)
//     .enter().append("div")
//       .attr("class", "node")
//       .call(position)
//       .style("background", function(d) { console.log(d); return color(d.name); })
//       .text(function(d) { return d.name; });


//   function position() {
// 	  this.style("left", function(d) { return d.x + "px"; })
// 	      .style("top", function(d) { return d.y + "px"; })
// 	      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
// 	      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
// 	}
// });



// d3.json("data/flare.json", function(error, root) {

// 	var margin = {top: 40, right: 10, bottom: 10, left: 10},
// 	    width = 960 - margin.left - margin.right,
// 	    height = 500 - margin.top - margin.bottom;

// 	var color = d3.scale.category20c();

// 	var treemap = d3.layout.treemap()
// 	    .size([width, height])
// 	    .sticky(true)
// 	    .value(function(d) { return d.size; });

// 	var canvas = d3.select("body").append("div")
// 	    .style("position", "relative")
// 	    .style("width", (width + margin.left + margin.right) + "px")
// 	    .style("height", (height + margin.top + margin.bottom) + "px")
// 	    .style("left", margin.left + "px")
// 	    .style("top", margin.top + "px");

//   var node = canvas.datum(root).selectAll(".node")
//       .data(treemap.nodes)
//     .enter().append("div")
//       .attr("class", "node")
//       .call(position)
//       .style("background", function(d) { return d.children ? color(d.name) : null; })
//       .text(function(d) { return d.children ? null : d.name; });

//   d3.selectAll("input").on("change", function change() {
//     var value = this.value === "count"
//         ? function() { return 1; }
//         : function(d) { return d.size; };

//     node
//         .data(treemap.value(value).nodes)
//       .transition()
//         .duration(1500)
//         .call(position);
//   });


//   function position() {
// 	  this.style("left", function(d) { return d.x + "px"; })
// 	      .style("top", function(d) { return d.y + "px"; })
// 	      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
// 	      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
// 	}
// });

