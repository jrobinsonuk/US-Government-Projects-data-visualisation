var selectedAgency = null;

var svgSize = {width:1000, height:800};

var svg = d3.select("#bubbles").append("svg")
							.attr("width", svgSize.width)
							.attr("height", svgSize.height);


var formatNumber = d3.format(",d");





d3.csv("data/projects-1.0.csv", function(error, projects) {
	// Projects loaded. We have an array as 'projects'


	// Gather information about agencies
	var agencies = new Array();
	projects.forEach(function(p, i) {
		var foundAgency = agencies.filter(function (agency) {
			return (agency.code == p.agencyCode);
		});

		// Retrieve/create agency
		var agency = null;
		if (foundAgency.length == 0) {
			// Add agency
			agency = {"name":p.agencyName, "code":p.agencyCode, "projectCount":0, "costMoreCount":0, "costLessCount":0, "scheduleMoreCount":0, "scheduleLessCount":0}
			agencies.push(agency);
		} else {
			// Agency existed
			agency = foundAgency[0];
		}

		// Update agency summary info
		agency.projectCount += 1;

		if (p.costVariance == 0) {
		} else if (p.costVariance > 0) {
			agency.costMoreCount += 1;
		} else {
			agency.costLessCount += 1;
		}

		if (p.scheduleVariance == 0) {
		} else if (p.scheduleVariance > 0) {
			agency.scheduleMoreCount += 1;
		} else {
			agency.scheduleLessCount += 1;
		}
	});

	agencies.sort(function(a, b) {
		if (a.name < b.name) return -1;
		if (b.name < a.name) return -1;
		return 0;
	});


	// Get drawing
	drawVisualisaton();


	d3.select("body").select("#total").text(formatNumber(projects.length));
	d3.select("body").select("#back").on("click", function () {
		selectedAgency = null;
		drawVisualisaton();
	});




	function drawVisualisaton() {
		// Clear
		// svg.text('');
		d3.selectAll('.d3-tip').remove();
		svg.selectAll('circle').remove();

		// Prepare to add data
		var force = d3.layout.force()
				        .size([svgSize.width, svgSize.height])
				        .linkDistance(10)
				        .on("tick", tick);

		var tip = d3.tip()
						.attr("class", "d3-tip")
						.offset([-10, 0]);
		svg.call(tip);
		

		if (selectedAgency == null) {
			// Initial - display agencies with number of active projects
			// size of bubble depends on projectCount
			// colour of bubble depends on costMoreCount percentage (greater => deeper green), costLessCount percentage (greater => deeper red)
			// summary stats for all agencies are put into progress bars


			// Update existing stuff
			force.nodes(agencies)
					.charge(function(d, i) {return d.projectCount/5.0 * (-10); })
					.start();

			tip.html(function (d) {
				return '<strong>' + d.name + '</strong>';
			});


			// Create nodes
			var node = svg.selectAll(".node")
							.data(force.nodes())
					        .attr("class", "node")
					        .enter().append("g")
					        .call(force.drag)
					        .on("click", agencyClick)
					        .on('mouseover', tip.show)
							.on('mouseout', tip.hide);

			node.append("circle")
					.attr("r", function (d, i) { return d.projectCount/5; })
					.style("fill", "#ff00ff")
					.style("stroke", "#000000");


			d3.select("body").select("#active").text(formatNumber(projects.length));
			d3.select("body").select("#totals").style("display", "none");
			d3.select("body").select("#back").style("display", "none");

		} else {
			// Projects - filtered from agency code
			// Size dependant on actual cost
			// colour of bubble depends on variance (negative => green, less => deeper), variance (positive => red, more => deeper)
			// summary stats for selected agency are put into progress bars

			var agencyProjects = projects.filter(function (project) {
				return (project.agencyCode == selectedAgency.code);
			});


			// Update existing stuff
			force.nodes(agencyProjects)
					.charge(function(d, i) {return 15 * (-10); })
					.start();

			tip.html(function (d) {
				return '<strong>' + d.projectName + '</strong>';
			});


			// Create nodes
			var node = svg.selectAll(".node")
							.data(force.nodes())
					        .attr("class", "node")
					        .enter().append("g")
					        .call(force.drag)
					        .on('mouseover', tip.show)
							.on('mouseout', tip.hide);

			node.append("circle")
					.attr("r", function (d, i) { return 15; })
					.style("fill", "#ff0000")
					.style("stroke", "#000000");


			d3.select("body").select("#active").text(formatNumber(agencyProjects.length));
			d3.select("body").select("#totals").style("display", "");
			d3.select("body").select("#back").style("display", "");
		}




		function tick() {
	        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	    }

	    function agencyClick(d) {
	    	if (d3.event.defaultPrevented) return; // click suppressed
			tip.hide;
			selectedAgency = d;
			drawVisualisaton();
	    }

	}


	
});