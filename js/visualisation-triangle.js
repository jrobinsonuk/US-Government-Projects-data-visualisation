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
		var planPercent = 0.8,
			under = true;

		var _leftTriangle = [{x:160, y:0}, {x:160, y:250}, {x:0, y:250}, {x:160, y:0}],
			_leftRule = [{x:(160*planPercent), y:(250*(1-planPercent))}, {x:160, y:(250*(1-planPercent))}],
			_rightTriangle = [{x:160, y:0}, {x:160, y:250}, {x:320, y:250}, {x:160, y:0}],
			_rightRule = [{x:160 + (160*(1-planPercent)), y:(250*(1-planPercent))}, {x:160, y:(250*(1-planPercent))}]
			;


		var node = svg.append("g")

		// Left half
		node.append("path")
			.attr("d", lineDrawer(_leftTriangle))
			.attr("stroke", "blue")
			.attr("stroke-width", 0.5)
			.attr("fill", "none");

		if (planPercent < 1) {
			// Fill
			var _actualFill = [{x:(160*planPercent), y:(250*(1-planPercent))}, {x:160, y:(250*(1-planPercent))}];
			if (under) {
				_actualFill.push({x:160, y:(250*2*(1-planPercent))});
				_actualFill.push({x:160*(planPercent-(1-planPercent)), y:(250*2*(1-planPercent))});
			} else {
				_actualFill.push({x:160, y:0});
			}
			_actualFill.push(_actualFill[0]); // finish off

			node.append("path")
				.attr("d", lineDrawer(_actualFill))
				.attr("fill", (under)? "green" : "red");

			// Budget line
			node.append("path")
				.attr("d", lineDrawer(_leftRule))
				.attr("stroke", "black")
				.attr("stroke-width", 2);
		}



		under = false;

		// Right half
		node.append("path")
				.attr("d", lineDrawer(_rightTriangle))
				.attr("stroke", "blue")
				.attr("stroke-width", 0.5)
				.attr("fill", "none");

		if (planPercent < 1) {
			// Fill
			var _actualFill = [{x:160 + (160*(1-planPercent)), y:(250*(1-planPercent))}, {x:160, y:(250*(1-planPercent))}];
			if (under) {
				_actualFill.push({x:160, y:(250*2*(1-planPercent))});
				_actualFill.push({x:160+160*(1-(planPercent-(1-planPercent))), y:(250*2*(1-planPercent))});
			} else {
				_actualFill.push({x:160, y:0});
			}
			_actualFill.push(_actualFill[0]); // finish off

			node.append("path")
				.attr("d", lineDrawer(_actualFill))
				.attr("fill", (under)? "green" : "red");


			// Budget line
			node.append("path")
				.attr("d", lineDrawer(_rightRule))
				.attr("stroke", "black")
				.attr("stroke-width", 2);
		}


		return node;
	}

	
});