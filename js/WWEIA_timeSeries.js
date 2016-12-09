$(function() {
	var vis = this;
	d3.select("#nutrient_type").on("change", updateVis);
	d3.select("#age_group").on("change", updateVis);
	// RESPONSIVE?: d3.select(window).on('resize', updateVis);
});


TimeSeriesChart = function(_parentElement, _dataIncome, _dataGender, _dataDRImin, _dataDRImax){
	this.parentElement = _parentElement;
  this.dataIncome = _dataIncome;
	this.dataGender = _dataGender;
	// hacky DRI min/max. Need to update numbers...mostly working with the DRImin file here.
		this.dataDRImin = _dataDRImin;
		this.dataDRImax = _dataDRImax;
	this.displayData = [];
	this.specificYear, this.yMin, this.yMax;
  this.initVis();
}

// Stacked Area Chart
TimeSeriesChart.prototype.initVis = function(){
	var vis = this;
	var width = $("#"+vis.parentElement).width();
	var height = $("#B").height()/2;
	console.log(height);
	vis.margin = { top: 40, right: 40, bottom: 60, left: 65 };
	vis.width = width - vis.margin.left - vis.margin.right,
  vis.height = Math.max(315,(height - vis.margin.top - vis.margin.bottom));

	vis.wrangleData();
  // SVG drawing area
	// non-responsive:
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	/* Responsive SVG
	vis.svg =	d3.select("#" + vis.parentElement).append("div")
			   .classed("svg-container", true) //container class to make it responsive
			   .append("svg")
			   .attr("preserveAspectRatio", "xMinYMin meet")
			   .attr("viewBox", "0 0 600 400")
			   .classed("svg-content-responsive", true);
		*/
	// Scales and axes
  vis.x = d3.scale.ordinal()
    .domain(years) //var years in main.js
    .rangePoints([0, vis.width]);
		//hack for now. Can do dates format later
	vis.y = d3.scale.linear()
		.range([vis.height, 0]);

	vis.xAxis = d3.svg.axis()
		  .scale(vis.x)
		  .orient("bottom")
			.ticks(years.length);
	vis.yAxis = d3.svg.axis()
	    .scale(vis.y)
	    .orient("left")
			.ticks(6);

	vis.axes = vis.svg.append("g");
	vis.axes.append("g")
	    .attr("class", "x-axis axis")
	    .attr("transform", "translate(0," + vis.height + ")");
	vis.axes.append("g")
			.attr("class", "y-axis axis");
	// X axis label
	vis.axes.append("text")
		.text("Year")
		.attr("class","axis-label")
		.attr("id","x-axis-label")
		.attr("text-anchor","end")
		.attr("transform", function(d){
			var tempX = vis.width/2;
			var tempY = vis.height+vis.margin.bottom-10;
			return ("translate("+ tempX +","+ tempY +")");
		});
	// Y axis label
	vis.axes.append("text")
		.attr("class","axis-label")
		.attr("id","y-axis-label")
		.attr("transform", "rotate(90)")
		.attr("transform", function(d){
			var tempX = 15-vis.margin.left;
			var tempY = vis.height/2 + vis.margin.top;
			return ("translate("+ tempX +","+ tempY +") rotate(270)");
		});

	// Define & append line
	vis.line = d3.svg.line()
		.x(function(d) { return vis.x(d.Year); })
		.y(function(d) { return vis.y(d.Value); });
	vis.lineChart = vis.svg.append("path")
		.attr("class","line lineChart");

	// Dietary Reference Intake line (super general/inaccurate...no data for 'all ages')
	vis.lineRef = vis.svg.append("line")
		.style("opacity", 0.5);

		vis.lineRef2 = vis.svg.append("line")
			.style("opacity", 0.5);

	// Tooltip
	vis.tip = d3.tip()
		.attr("class","d3-tip")
		.offset([-10,0]);
	vis.svg.call(vis.tip);

/*
	// MULTI-LINE??
	vis.priceline = d3.svg.line()
    .x(function(d) { return vis.x(d.Year); })
    .y(function(d) { return vis.y(d.Value); });
*/
  vis.updateVis();
}

// Data
TimeSeriesChart.prototype.wrangleData = function(){
	var vis = this;
	vis.nutrient_type = $("#nutrient_type").val();
	vis.age_group = $("#age_group").val();

	vis.displayData = vis.dataIncome.
		filter(function(d){ return d.Income=="All" && d.Age==vis.age_group;}).
		map(function(d){ return { Year: d.Year, Value: d[vis.nutrient_type]};});

/*
	//multi-line graph??

	var tempData = vis.dataIncome.
		filter(function(d){ return d.Age==vis.age_group;}).
		map(function(d){ return { Year: d.Year, Income: d.Income, Value: d[vis.nutrient_type]};});

	vis.incomeNest = d3.nest()
    .key(function(d) {return d.Income;})
    .entries(tempData);
	console.log(vis.incomeNest);
	vis.color = d3.scale.category10();
*/

	//DRI does not exist for all ages.
	if (vis.age_group != "2 and over") {
		vis.DRImin = vis.dataDRImin.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
		vis.DRImax = vis.dataDRImax.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	} else {
		vis.DRImin = 0;
		vis.DRImax = 0;
	}

	// Get range for y axis for this nutrient type. Then don't change within age groups.
	vis.yMin = Math.min(
		d3.min(vis.dataIncome, function(d) { return d[vis.nutrient_type]; }),
		d3.min(vis.dataGender, function(d) { return d[vis.nutrient_type]; }),
		d3.min(vis.dataDRImin, function(d) { return d[vis.nutrient_type]; })
	);
	vis.yMax = Math.max(
		d3.max(vis.dataIncome, function(d) { return d[vis.nutrient_type]; }),
		d3.max(vis.dataGender, function(d) { return d[vis.nutrient_type]; }),
		d3.max(vis.dataDRImax, function(d) { return d[vis.nutrient_type]; })
	);

	// Buffer top/bottom of y range
	var buffer = vis.yMax/10;
	console.log ("NUTRIENT TYPE = " + vis.nutrient_type);
	console.log ("THIS IS y MIN/MAX:" + this.yMin + " - " + this.yMax);
	vis.yMax += buffer;
	vis.yMin -= buffer;
	console.log ("THIS IS y MIN/MAX:" + this.yMin + " - " + this.yMax);
}

// Update visualization
TimeSeriesChart.prototype.updateVis = function(){
	var vis = this;
	vis.wrangleData();
	console.log("UPDATE-------------");
	console.log(vis.displayData);

	if (vis.SpecificYear != null) { //if a specific year is selected, update income and gender charts

		[vis.income_chart, vis.gender_chart].forEach(function(chart) {
			chart.year = vis.SpecificYear;
			chart.yMin = vis.yMin;
			chart.yMax = vis.yMax;
			chart.updateVis();
		});
	}

	// Update domains and axes
	// vis.y.domain([vis.yMin, vis.yMax]);
	vis.y.domain([0,vis.yMax]);
	d3.select("#y-axis-label").text(vis.nutrient_type);

	// Draw/update line
	vis.svg.selectAll(".lineChart")
		.datum(vis.displayData)
		.transition().duration(300)
		.attr("d",vis.line);
	// Draw/update DRI line
	if (vis.DRImin != 0 && vis.DRImin != null) {
		vis.lineRef.transition().duration(trans)
			.style("stroke", "#666")
			.style("stroke-width", 2)
			.style("stroke-dasharray", "3,3")
			.attr("x1", 0)
	    .attr("y1", function(){ return vis.y(vis.DRImin);})
	    .attr("x2", vis.width)
	    .attr("y2", function(){ return vis.y(vis.DRImin);});
	}
	if (vis.DRImax != 0 && vis.DRImax != null) {
		vis.lineRef2.transition().duration(trans)
			.style("stroke", "#666")
			.style("stroke-width", 2)
			.style("stroke-dasharray", "3,3")
			.attr("x1", 0)
	    .attr("y1", function(){ return vis.y(vis.DRImax);})
	    .attr("x2", vis.width)
	    .attr("y2", function(){ return vis.y(vis.DRImax);});
	}

	// Draw circles
	vis.circles = this.svg.selectAll("circle")
		.data(vis.displayData);

	// EXIT
	vis.circles.exit();
	// ENTER. Can define every static attr here (i.e. radius always r)
	vis.circles.enter().append("circle")
		.attr("class","circle clickable")
		.attr("r", "5")
		.style("fill", colorMedium);
	// UPDATE
	vis.circles.transition().duration(trans)
		.attr("cx", function(d) { return vis.x(d.Year); })
		.attr("cy", function(d) { return vis.y(d.Value); })
		.style("fill", colorMedium);

	// Javascript shorthand! tip.show is actually bound to the circles object
	vis.circles.on("mouseover", vis.tip.show) // same as .on("mouseover", function(d) {tip.show(d);})
	.on("mouseout", vis.tip.hide)
		.on("click",function(d) {vis.showSpecificYear(d.Year);});

/*
	//MULTI-LINE??
  vis.incomeNest.forEach(function(d) {
      vis.svg.append("path")
          .attr("class", "line")
          .style("stroke", function() { // Add dynamically
              return d.color = vis.color(d.key); })
          .attr("d", vis.priceline(d.values));
	});
*/

	// Create bar charts without waiting for user to click on a year
	vis.showSpecificYear(2013);

  // Update tooltip text
	vis.tip.html(function(d){ return d.Value; });
	// Call axis functions with the new domain
	vis.svg.select(".x-axis").call(vis.xAxis).transition().duration(trans);
  vis.svg.select(".y-axis").call(vis.yAxis).transition().duration(trans);
}

// Data
TimeSeriesChart.prototype.showSpecificYear = function(year){
	var vis = this;
	if (vis.SpecificYear == null) { //if creating bar chart for the first time
		vis.SpecificYear = year;
		vis.income_chart = new BarChart("Income", vis.dataIncome, vis.dataDRImin, vis.dataDRImax, vis.yMin, vis.yMax, year);
		vis.gender_chart = new BarChart("Gender", vis.dataGender, vis.dataDRImin, vis.dataDRImax, vis.yMin, vis.yMax, year);
	} else { //if bar chart already exists
		vis.income_chart.year = year;
		vis.gender_chart.year = year;
		vis.income_chart.updateVis();
		vis.gender_chart.updateVis();
	}

}
