d3.csv("data/projects-1.0.csv", function(error, projects) {
	// Projects loaded. We have an array as 'projects'

	console.log(projects);


	var svgSize = {width:1200, height:800},
		formatNumber = d3.format(",d"),
		selectedAgency = null;

	var lineDrawer = d3.svg.line()
								.x(function (d) {return d.x})
								.y(function (d) {return d.y})
								.interpolate("linear");


	


	// Create canvas
	var svg = d3.select("#triangles").append("svg")
								.attr("width", svgSize.width)
								.attr("height", svgSize.height);


	drawTriangle();
	drawTriangle()
				.attr("transform", function(d) { return "translate(600,400)"; });


	function drawTriangle() {
		var _leftTriangle = [{x:200, y:5}, {x:200, y:255}, {x:40, y:255}, {x:200, y:5}],
			_rightTriangle = [{x:200, y:5}, {x:200, y:255}, {x:360, y:255}, {x:200, y:5}];


		var node = svg.append("g")

		node.append("path")
			.attr("d", lineDrawer(_leftTriangle))
			.attr("stroke", "blue")
			.attr("stroke-width", 1)
			.attr("fill", "none");

		node.append("path")
				.attr("d", lineDrawer(_rightTriangle))
				.attr("stroke", "blue")
				.attr("stroke-width", 1)
				.attr("fill", "none");


		return node;
	}

	
});