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
	// hacky DRI min/max.
		this.dataDRImin = _dataDRImin;
		this.dataDRImax = _dataDRImax;
	this.displayData = [];
	this.specificYear, this.yMin, this.yMax;
	this.nutrient_type = "Calories";
	this.age_group = "20 and over";
  this.initVis();
}

// Stacked Area Chart
TimeSeriesChart.prototype.initVis = function(){
	var vis = this;
	var width = $("#"+vis.parentElement).width();
	var height = $("#B").height()/2 - 50;
	vis.margin = { top: 40, right: 40, bottom: 60, left: 65 };
	vis.width = width - vis.margin.left - vis.margin.right,
  vis.height = Math.max(300,(height - vis.margin.top - vis.margin.bottom));

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
	// Title
	vis.svg.append("text")
		.attr("class","chart-title");

	// Define OK zone
	vis.OKzone = vis.svg.append("g").attr("class", "OKzone");
	vis.groupLabels = vis.svg.append("g").attr("class","group_labels");
	// Define & append line
	vis.line = d3.svg.line()
		.x(function(d) { return vis.x(d.Year); })
		.y(function(d) { return vis.y(d.Value); });
	vis.lineChart = vis.svg.append("path")
		.attr("class","line lineChart");

	// Dietary Reference Intake line (super general/inaccurate...no data for 'all ages')
	vis.lineRefMin = vis.svg.append("line").style("opacity", 0.5).attr("class","lineRefMin");
	vis.lineRefMax = vis.svg.append("line").style("opacity", 0.5).attr("class","lineRefMax");

	// Tooltip for each year's data
	vis.tip = d3.tip()
		.attr("class","d3-tip")
		.offset([-12,0]);
	vis.svg.call(vis.tip);

	/*
	// Tooltip for OK zone
	vis.tipOKzone = d3.tip()
		.attr("class","d3-tip")
		.offset([-10,0]);
	vis.svg.call(vis.tipOKzone);

	*/

	vis.showSpecificYear(2013);
  vis.updateVis();
}

// Data
TimeSeriesChart.prototype.wrangleData = function(){
	var vis = this;
	//vis.age_group = $("#age_group").val();

	vis.displayData = vis.dataIncome.
		filter(function(d){ return d.Income=="All" && d.Age==vis.age_group;}).
		map(function(d){ return { Year: d.Year, Value: d[vis.nutrient_type]};});

	// GET OVERALL MIN/MAX FOR Y VALUE:
	// Get min/max from WWEIA data
	vis.yMin = Math.min(
		d3.min(vis.dataIncome, function(d) { return d[vis.nutrient_type]; }),
		d3.min(vis.dataGender, function(d) { return d[vis.nutrient_type]; })  );
	vis.yMax = Math.max(
		d3.max(vis.dataIncome, function(d) { return d[vis.nutrient_type]; }),
		d3.max(vis.dataGender, function(d) { return d[vis.nutrient_type]; })  );
	// Get min/max from DRI data (some nutrient types might not have DRI min/max's)
	var absMin = d3.min(vis.dataDRImin, function(d) { return d[vis.nutrient_type] || Infinity; });
	var absMax = d3.max(vis.dataDRImax, function(d) { return d[vis.nutrient_type]; });
	// If DRI min/max is defined, compare it to the WWEIA min/max values to get combined min/max values.
	if (absMin) {
		vis.yMin = Math.min(vis.yMin,	absMin);
		// If absMax is undefined, yMax might be lower than absMin. Need to stretch y axis to absMin (case: Fiber)
		if (absMax==null) { vis.yMax = Math.max(vis.yMax, d3.max(vis.dataDRImin, function(d) { return d[vis.nutrient_type]; })); }
	}
	if (absMax) { vis.yMax = Math.max(vis.yMax,	absMax);}

	// Buffer top/bottom of y range
	var buffer = vis.yMax/10;
	vis.yMax += buffer;
	vis.yMin -= buffer;

	// Set reference lines for this specific nutrient+age group combo
	//if (vis.age_group != "2 and over") //--> no reference DRI for "all" ages
	vis.DRImin = vis.dataDRImin.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	vis.DRImax = vis.dataDRImax.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	if (vis.DRImin == null) { vis.DRImin = 0; }
	if (vis.DRImax == null) { vis.DRImax = vis.yMax; }
}

// Update visualization
TimeSeriesChart.prototype.updateVis = function(){
	var vis = this;
	vis.wrangleData();
	// console.log("UPDATE TIME SERIES-------------");
	// console.log(vis.dataIncome);
	// console.log(vis.specificYear);
	// console.log(vis.nutrient_type);
	// console.log(vis.age_group);
	// console.log ("THIS IS y MIN/MAX (post-buffer):" + this.yMin + " - " + this.yMax);
	// console.log ("THIS IS DRI:" + this.DRImin + " - " + this.DRImax);
	if (vis.specificYear != null) { //if a specific year is selected, update income and gender charts

		[vis.income_chart, vis.gender_chart].forEach(function(chart) {
			chart.year = vis.specificYear;
			chart.yMin = vis.yMin;
			chart.yMax = vis.yMax;
			chart.nutrient_type = vis.nutrient_type;
			chart.age_group = vis.age_group;
			chart.updateVis();
		});
	}

	// Update domains and axes
	// vis.y.domain([vis.yMin, vis.yMax]);
	vis.y.domain([0,vis.yMax]);
	d3.select("#y-axis-label").text(function() {
		var unit = nutrient_labels.filter(function(n) {
			return n.nutrient_type == vis.nutrient_type;
		})[0].unit;
		return vis.nutrient_type + "  ("+unit+")";
	});

	// chart titles
	vis.svg.select(".chart-title")
		.attr("x", vis.width/2)
		.attr("y",-15)
		.attr("text-anchor", "middle")
		.text(function(d){
			var nutrient = nutrient_labels.filter(function(n) {
				return n.nutrient_type == vis.nutrient_type;
			})[0].nutrient;
			if (nutrient=="Calories") { nutrient = "Caloric"; }
			return nutrient+" Intake in 2001-2013 (Averages)";
		});

	// OK zone
	vis.targetZone = vis.OKzone.selectAll("rect")
		.data(vis.dataDRImin);
	vis.targetZone.exit().remove();
	vis.targetZone.enter().append("rect")
		.attr("class","targetZone")
		.attr("fill", "#effff8");
	vis.targetZone.transition().duration(trans)
		.attr("x", 1)
		.attr("y", function(){ return vis.y(vis.DRImax);})
		.attr("height", function(){
			// If DRImin = 0, make sure this block doesn't cover up the y axis
			if (vis.DRImin == 0) { return (vis.y(vis.DRImin) - vis.y(vis.DRImax)) - 1; }
			else { return (vis.y(vis.DRImin) - vis.y(vis.DRImax)); }
		})
		.attr("width", vis.width-1);

	// vis.targetZone.on("mouseover", vis.tipOKzone.show) // same as .on("mouseover", function(d) {tip.show(d);})
	// .on("mouseout", vis.tipOKzone.hide);


	// Draw/update line
	vis.svg.selectAll(".lineChart")
		.datum(vis.displayData)
		.transition().duration(300)
		.attr("d",vis.line);

	// Draw/update DRI line
	vis.lineRefMin.transition().duration(trans)
		.style("stroke", "green")
		.style("opacity", function() {
			if (vis.DRImin==0 || vis.DRImin==vis.DRImax) { return 0; }
			else { return 0.5; }
		})
		.style("stroke-width", 1)
		.style("stroke-dasharray", "2,2")
		.attr("x1", 0)
		.attr("y1", function(){ return vis.y(vis.DRImin);})
		.attr("x2", vis.width)
		.attr("y2", function(){ return vis.y(vis.DRImin);});
	vis.lineRefMax.transition().duration(trans)
		.style("stroke", function() { if (vis.DRImax != vis.yMax) { return colorDark; }})
		.style("opacity", 0.5)
		.style("stroke-width", 1)
		.style("stroke-dasharray", "2,2")
		.attr("x1", 0)
    .attr("y1", function(){ return vis.y(vis.DRImax);})
    .attr("x2", vis.width)
    .attr("y2", function(){ return vis.y(vis.DRImax);});


	// LABEL reference line:
	vis.DRIlabel = vis.groupLabels.selectAll(".DRI_label")
		.data([{min:vis.DRImin, max:vis.DRImax}]);
	vis.DRIlabel.exit().remove();
	vis.DRIlabel.enter().append("text")
		.attr("class", "label DRI_label")
		.attr("x", vis.width-2)
		.attr("text-anchor","end")
	vis.DRIlabel.transition().duration(trans)
		.attr("y", function (d) {
			if (d.max==vis.yMax){ return vis.y(d.min) - 6; }
			else { return vis.y(d.max) + 11; }
		})
		.text (function(d) {
			var unit = nutrient_labels.filter(function(n) {
				return n.nutrient_type == vis.nutrient_type;
			})[0].unit;
			if (d.min==d.max) { return d.max + unit +"*"; }
			else if (d.min==0) { return "< "+ d.max + unit +"*"; }
			else if (d.max==vis.yMax) { return "> "+ d.min + unit +"*"; }
			else { return d.min+" - "+d.max + unit +"*"; }
		})




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
		.on("click",function(d) {
			vis.showSpecificYear(d.Year);
			vis.updateSpecificYearCircle();
		});
	vis.updateSpecificYearCircle();

  // Update tooltip text
	vis.tip.html(function(d){
		var unit = nutrient_labels.filter(function(n) {
			return n.nutrient_type == vis.nutrient_type;
		})[0].unit;
		var nutrient = vis.nutrient_type.toLowerCase();
		if (nutrient=="calories") { nutrient = "caloric"; }

		var barChartMsg = "Click for more details.";
		if (d.Year==vis.specificYear) {barChartMsg = "See bar charts for more details.";}

		var sampleSize = vis.dataIncome.filter(function(item) {
			return item.Year==d.Year && item.Age==vis.age_group && item.Income=="All";
		})[0]["Sample Size"];
		var text = "In <span class='highlight'>"+ d.Year +
		"</span>, the average <span class='highlight'>" + nutrient +
		"</span> intake for <br>Americans aged <span class='highlight'>" + vis.age_group +
		"</span> was <span class='highlight'>" + d.Value + "</span> " + unit +
		".<br><div class='note'>Sample Size: "+sampleSize+".<br>"+barChartMsg+"</div>";
		return text;
	});
	/*
	vis.tipOKzone.html(function(d) {return "LALALALALALALLALALALALALA"})
		.offset(function() {
			if (vis.DRImax==vis.yMax || vis.DRImin==0) { return [20,0]; }
			else { return [-10,0]; }
		});
		*/
	// Call axis functions with the new domain
	vis.svg.select(".x-axis").call(vis.xAxis).transition().duration(trans);
  vis.svg.select(".y-axis").call(vis.yAxis).transition().duration(trans);
}

// Data
TimeSeriesChart.prototype.showSpecificYear = function(year){
	var vis = this;
	if (vis.specificYear == null) { //if creating bar chart for the first time
		vis.specificYear = year;
		vis.income_chart = new BarChart("Income", vis.dataIncome, vis.dataDRImin, vis.dataDRImax, vis.yMin, vis.yMax, year);
		vis.gender_chart = new BarChart("Gender", vis.dataGender, vis.dataDRImin, vis.dataDRImax, vis.yMin, vis.yMax, year);
	} else { //if bar chart already exists
		vis.income_chart.year = year;
		vis.gender_chart.year = year;
		vis.income_chart.nutrient_type = vis.nutrient_type;
		vis.gender_chart.nutrient_type = vis.nutrient_type;
		vis.income_chart.age_group = vis.age_group;
		vis.gender_chart.age_group = vis.age_group;
		vis.income_chart.updateVis();
		vis.gender_chart.updateVis();
		vis.specificYear = year;
	}
}

TimeSeriesChart.prototype.updateSpecificYearCircle = function() {
	var vis = this;
	var dataSpecificYear = vis.displayData.filter(function(d) { return d.Year==vis.specificYear; });
	vis.circleHighlight = this.svg.selectAll(".specificYear")
		.data(dataSpecificYear);

	vis.circleHighlight.exit().remove();
	vis.circleHighlight.enter().append("circle")
		.attr("class","circle specificYear")
		.attr("r", 8)
		.style("fill", "none");
	// UPDATE
	vis.circleHighlight.transition().duration(trans)
		.attr("cx", function(d) { return vis.x(d.Year); })
		.attr("cy", function(d) { return vis.y(d.Value); })
		.style("stroke", colorDark)
		.style("stroke-width", 2);

}
