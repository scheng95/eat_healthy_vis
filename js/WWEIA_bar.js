var trans = 400;
var colorMain = "#ccc";
var colorOutline = "#999";


BarChart = function(_chartType, _data, _dataDRImin, _dataDRImax, _yMin, _yMax, _year){
	this.chartType = _chartType;
  this.data = _data;
	this.dataDRImin = _dataDRImin; this.dataDRImax = _dataDRImax;
	this.yMin = _yMin;
	this.yMax = _yMax;
	this.year = _year;
	this.displayData = [];
	if (_chartType == "Income") { this.xGroups = ["$0 - $24,999","$25,000 - $74,999","$75,000 and higher","All"];}
	else { this.xGroups = ["Male", "Female"];}
	console.log("Min/max = " + this.yMin+" - "+ this.yMax);

	//$("#WWEIA_spacer").height($("#WWEIA_dropdowns").height());

  this.initVis();
}

// Stacked Area Chart
BarChart.prototype.initVis = function(){
	var vis = this;
	var width = $("#WWEIA_"+vis.chartType).width();
	vis.margin = { top: 40, right: 50, bottom: 60, left: 70 };
	vis.width = width - vis.margin.left - vis.margin.right,
	vis.height = Math.max(150,((width*3/5) - vis.margin.top - vis.margin.bottom));
	if (vis.chartType == "Gender") { vis.height = vis.height/2; }
	vis.barHeight = 30;
	this.wrangleData();
  // SVG drawing area
	vis.svg = d3.select("#WWEIA_" + vis.chartType).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Scales and axes
  vis.x = d3.scale.ordinal()
    .rangeRoundBands([0, vis.height], 0.2);
		//hack for now. Will do dates format later
	vis.y = d3.scale.linear()
		.range([0, vis.width]);

	vis.xAxis = d3.svg.axis()
		  .scale(vis.x)
		  .orient("left");
	vis.yAxis = d3.svg.axis()
	    .scale(vis.y)
	    .orient("top");

	vis.svg.append("g")
	    .attr("class", "x-axis axis")
			.attr("transform", function(d){ return ("translate("+vis.margin.left+",0)"); });
	vis.svg.append("g")
			.attr("class", "y-axis axis y-axis-hide")
			.attr("transform", function(d){ return ("translate(0,"+ vis.margin.top +")"); });;

	// Title
	vis.svg.append("text")
		.attr("class","chart-title")
		.attr("x",vis.margin.left)
		.attr("y",-20);


	/*
	// Tooltip
	vis.tip = d3.tip()
		.attr("class","d3-tip");
	vis.svg.call(vis.tip);
*/
	// TO-DO: Filter data
  vis.updateVis();
}

// Data
BarChart.prototype.wrangleData = function(){
	var vis = this;
	vis.age_group = $("#age_group").val();
	vis.nutrient_type = $("#nutrient_type").val();
	vis.displayData = [];
	var dataByYear = vis.data.
		filter(function(d){ return d.Year == vis.year;}).
		map(function(d){ return { Key: d[vis.chartType], Age: d.Age, Value: d[vis.nutrient_type]}});
	vis.xGroups.forEach(function(i) {
		vis.displayData.push(
			{ Key: i,
				Value: dataByYear.
					filter(function(d){ return d.Key == i && d.Age == vis.age_group;}).
					map(function(d){ return d.Value;})[0]
			});
	});
	if (vis.age_group != "2 and over") {
		vis.DRImin = vis.dataDRImin.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
		vis.DRImax = vis.dataDRImax.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	} else {
		vis.DRImin = 0;
		vis.DRImax = 0;
	}
}

// Update visualization
BarChart.prototype.updateVis = function(){
	var vis = this;
	vis.wrangleData();
	console.log("UPDATED BAR-------------");
	console.log(vis.nutrient_type);
	console.log("----BAR CHART: "+this.yMin+" - "+this.yMax);
	// Update domains
	vis.x.domain(vis.displayData.map(d => d.Key));
	vis.y.domain([vis.yMin, vis.yMax]);

	// Bars
	vis.bars = vis.svg.selectAll("rect")
		.data(vis.displayData);
	vis.bars.exit().remove().transition().duration(trans);
	vis.bars.enter().append("rect")
		.attr("class","rect")
		.attr("x", vis.margin.left)
		.attr("y", function(d) { return vis.x(d.Key);})
		.attr("height", vis.x.rangeBand())
		.attr("fill", colorMedium);
	vis.bars.transition().duration(trans)
		.attr("width", function(d) { return vis.y(d.Value); });

	// Labels
	vis.labels = vis.svg.selectAll(".label")
		.data(vis.displayData);
  vis.labels.exit().remove().transition().duration(trans);
	vis.labels.enter().append("text")
		.attr("y", function(d) { return vis.x(d.Key) + vis.x.rangeBand()/2; })
		.attr("alignment-baseline","middle")
		.attr("class", "label label-white");
	vis.labels.transition().duration(trans)
		.attr("x", function(d) { return vis.y(d.Value) + vis.margin.left - vis.barHeight/3; })
		.attr("text-anchor","end")
		.text(function(d){ return d.Value;});

	vis.svg.select(".chart-title")
		.text(function(d){return vis.nutrient_type+" by "+vis.chartType+" in "+vis.year;})
	// Draw/update line
	vis.svg.selectAll(".line")
		.datum(vis.displayData)
		.transition().duration(300)
		.attr("d",vis.line);

	if (vis.DRImin != 0 && vis.DRImin != null) {
		// Reference
		vis.lineRef = vis.svg.selectAll(".lineRef")
			.data([vis.DRImin]);

		vis.lineRef.enter().append("line")
			.attr("class","lineRef")
			.style("stroke", "#666")
			.style("stroke-width", 2)
			.style("stroke-dasharray", "3,3")
			.style("opacity", 0.5);
		vis.svg.select(".lineRef").transition().duration(trans)
			.attr("x1", function(){ return vis.y(vis.DRImin)+vis.margin.left;})
	    .attr("y1", 0)
	    .attr("x2", function(){ return vis.y(vis.DRImin)+vis.margin.left;})
	    .attr("y2", vis.height);
	}

	if (vis.DRImax != 0 && vis.DRImax != null) {
		// Reference
		vis.lineRef2 = vis.svg.selectAll(".lineRef2")
			.data([vis.DRImax]);

		vis.lineRef2.enter().append("line")
			.attr("class","lineRef2")
			.style("stroke", "#222")
			.style("stroke-width", 2)
			.style("stroke-dasharray", "3,3")
			.style("opacity", 0.5);
		vis.svg.select(".lineRef2").transition().duration(trans)
			.attr("x1", function(){ return vis.y(vis.DRImax)+vis.margin.left;})
	    .attr("y1", 0)
	    .attr("x2", function(){ return vis.y(vis.DRImax)+vis.margin.left;})
	    .attr("y2", vis.height);
	}
/*
	// Tooltip
	vis.bars.on("mouseover", vis.tip.show)
		.on("mouseout", vis.tip.hide);

  // Tooltip text
	vis.tip.html(function(d){ return d.Value; });
	//vis.tip.offset(function(d) { return "[0,0]"; });

	*/
	// Call axis functions with the new domain
	vis.svg.select(".x-axis").call(vis.xAxis).transition().duration(trans);
  vis.svg.select(".y-axis").call(vis.yAxis).transition().duration(trans);

}

// Data
BarChart.prototype.showSpecificYear = function(year){
	var vis = this;
	var yearData = vis.data.filter(function(d){ return d.Year==year;});
	var incomeDataByYear = yearData.map(function(d){
		return { Year: d.Year, Income: d.Income, Age: d.Age, Value: d[vis.nutrient_type]};
	});
	console.log(incomeDataByYear);
	income_chart = new BarChart("IncomeChart_WWEIA", incomeDataByYear);

}
