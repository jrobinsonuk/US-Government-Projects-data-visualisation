d3.csv("data/projects-1.0.csv", function(error, projects) {
	// Projects loaded. We have an array as 'projects'


	// Gather information about agencies
	var agencies = new Array();
	agencies.push({"name":"test", "code":100, "projectCount":1});
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

	console.log("agencies = "+ JSON.stringify(agencies));




	// Initial - display agencies with number of active projects
	// size of bubble depends on projectCount
	// colour of bubble depends on costMoreCount percentage (greater => deeper green), costLessCount percentage (greater => deeper red)
	// summary stats for all agencies are put into progress bars



	// Projects - filtered from agency code
	// Size dependant on actual cost
	// colour of bubble depends on variance (negative => green, less => deeper), variance (positive => red, more => deeper)
	// summary stats for selected agency are put into progress bars
});