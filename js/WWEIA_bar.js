var trans = 400;
var colorMain = "#ccc";
var colorOutline = "#999";
var greenZone = "#e8fff5";
var colorShame = "#ff7575";


BarChart = function(_chartType, _data, _dataDRImin, _dataDRImax, _yMin, _yMax, _year){
	this.chartType = _chartType;
  this.data = _data;
	this.dataDRImin = _dataDRImin; this.dataDRImax = _dataDRImax;
	this.yMin = _yMin;
	this.yMax = _yMax;
	this.year = _year;
	this.displayData = [];
	this.nutrient_type="Calories";
	this.age_group="20 and over";
	if (_chartType == "Income") { this.xGroups = ["$0 - $24,999","$25,000 - $74,999","$75,000 and higher","All"];}
	else { this.xGroups = ["Male", "Female"];}
	// console.log("Min/max = " + this.yMin+" - "+ this.yMax);
	//$("#WWEIA_spacer").height($("#WWEIA_dropdowns").height());

  this.initVis();
}

// Stacked Area Chart
BarChart.prototype.initVis = function(){
	var vis = this;
	var width = $("#WWEIA_"+vis.chartType).width();
	var timeSeriesHeight = $("#timeSeriesChart_WWEIA").height();
	vis.margin = { top: 40, right: 50, bottom: 20, left: 60 };
	vis.width = width - vis.margin.left - vis.margin.right,
	vis.height = timeSeriesHeight*0.45;
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
    .rangeRoundBands([0, vis.height], 0.25);
	vis.y = d3.scale.linear()
		.range([vis.margin.left, vis.width]);

	vis.xAxis = d3.svg.axis()
		  .scale(vis.x)
		  .orient("left");
	vis.yAxis = d3.svg.axis()
	    .scale(vis.y)
	    .orient("top");


	// Define OK zone
	vis.OKzone = vis.svg.append("g").attr("class", "OKzone");

	// Title
	vis.svg.append("text")
		.attr("class","chart-title");

	vis.groupRefLines = vis.svg.append("g")
		.attr("class","group_refLines");
	vis.groupBars = vis.svg.append("g")
		.attr("class","group_bars");
	vis.groupLabels = vis.svg.append("g")
		.attr("class","group_labels");

	//AXES
	vis.svg.append("g")
    .attr("class", "x-axis axis")
		.attr("transform", function(d){ return ("translate("+vis.margin.left+",0)"); });
	vis.svg.append("g")
		.attr("class", "y-axis axis y-axis-hide");

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
	//vis.age_group = $("#age_group").val();
	//vis.nutrient_type = $("#nutrient_type").val();

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
	// Set reference lines for this specific nutrient+age group combo
	//if (vis.age_group != "2 and over") //--> no reference DRI for "all" ages
	vis.DRImin = vis.dataDRImin.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	vis.DRImax = vis.dataDRImax.filter(function(d){ return d.Gender=="All" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	vis.DRIminMale = vis.dataDRImin.filter(function(d){ return d.Gender=="Male" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	vis.DRImaxMale = vis.dataDRImax.filter(function(d){ return d.Gender=="Male" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	vis.DRIminFemale = vis.dataDRImin.filter(function(d){ return d.Gender=="Female" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	vis.DRImaxFemale = vis.dataDRImax.filter(function(d){ return d.Gender=="Female" && d.Age==vis.age_group;})[0][vis.nutrient_type];
	if (vis.DRImin == null) {
		vis.DRImin = 0;
		vis.DRIminMale = 0;
		vis.DRIminFemale = 0;
	}
	if (vis.DRImax == null) {
		vis.DRImax = vis.yMax;
		vis.DRImaxMale = vis.yMax;
		vis.DRImaxFemale = vis.yMax;
	}

}

// Update visualization
BarChart.prototype.updateVis = function(){
	var vis = this;
	vis.wrangleData();
	// console.log("UPDATED BAR--------------------");
	// console.log(vis.age_group);
	// console.log(vis.nutrient_type);
	// console.log(vis.DRImin+", "+vis.DRImax);
	// Update domains
	vis.x.domain(vis.displayData.map(d => d.Key));
	vis.y.domain([0, vis.yMax]);

	// Bars
	vis.bars = vis.groupBars.selectAll("rect")
		.data(vis.displayData);
	vis.bars.exit().remove().transition().duration(trans);
	vis.bars.enter().append("rect")
		.attr("class","rect")
		.attr("x", vis.margin.left)
		.attr("y", function(d) { return vis.x(d.Key);})
		.attr("height", vis.x.rangeBand())
		.attr("fill", colorMedium);
	vis.bars.transition().duration(trans)
		.attr("width", function(d) { return vis.y(d.Value)-vis.margin.left; });

	var unit = nutrient_labels.filter(function(n) {
		return n.nutrient_type == vis.nutrient_type;
	})[0].unit;
	// Labels
	vis.labels = vis.groupLabels.selectAll(".label")
		.data(vis.displayData);
  vis.labels.exit().remove().transition().duration(trans);
	vis.labels.enter().append("text")
		.attr("y", function(d) { return vis.x(d.Key) + vis.x.rangeBand()/2; })
		.attr("alignment-baseline","middle")
		.attr("class", "label label-white");
	vis.labels.transition().duration(trans)
		.attr("x", function(d) { return vis.y(d.Value) - vis.barHeight/3; })
		.attr("text-anchor","end")
		.text(function(d){
			return d.Value+" "+unit;
		});



	// chart titles
	vis.svg.select(".chart-title")
		.attr("x", vis.margin.left)
		.attr("y",-15)
		.text(function(d){
			var nutrient = nutrient_labels.filter(function(n) {
				return n.nutrient_type == vis.nutrient_type;
			})[0].nutrient;
			if (nutrient=="Calories") { nutrient = "Caloric"; }
			return nutrient+" Intake in "+vis.year+" (by "+vis.chartType +")";
		});

	if (vis.chartType == "Income") {
			vis.lineRefMin = vis.groupRefLines.selectAll(".lineRefMin")
				.data([vis.DRImin]);
			vis.lineRefMax = vis.groupRefLines.selectAll(".lineRefMax")
				.data([vis.DRImax]);

			vis.lineRefMin.enter().append("line")
				.attr("class","lineRefMin")
				.style("stroke-width", 1)
				.style("stroke-dasharray", "2,2")
				.style("opacity", 0.5);
			vis.lineRefMax.enter().append("line")
				.attr("class","lineRefMax")
				.style("stroke-width", 1)
				.style("stroke-dasharray", "2,2")
				.style("opacity", 0.5);

			// Draw/update DRI line
			vis.svg.selectAll(".lineRefMin").transition().duration(trans)
				.style("stroke", "green")
				.style("opacity", function() {
					if (vis.DRImin==0 || vis.DRImin==vis.DRImax) { return 0; }
					else { return 0.5; }
				})
				.attr("x1", function(){ return vis.y(vis.DRImin);})
				.attr("y1", 0)
				.attr("x2", function(){ return vis.y(vis.DRImin);})
				.attr("y2", vis.height);
			vis.svg.selectAll(".lineRefMax").transition().duration(trans)
				.style("stroke", function() {
					if (vis.DRImax != vis.yMax) { return colorDark; }
					// if DRImax = yMax, then don't draw line
				})
				.attr("x1", function(){ return vis.y(vis.DRImax);})
				.attr("y1", 0)
				.attr("x2", function(){ return vis.y(vis.DRImax);})
				.attr("y2", vis.height);


			// TARGET zone
			vis.targetZone = vis.OKzone.selectAll("rect")
				.data([vis.DRImin]);
			vis.targetZone.exit().remove();
			vis.targetZone.enter().append("rect")
				.attr("class","targetZone")
				.attr("fill", greenZone);
			vis.targetZone.transition().duration(trans)
				.attr("x", function(){ return vis.y(vis.DRImin); })
				.attr("y", 0)
				.attr("height", vis.height)
				.attr("width", function(){return (vis.y(vis.DRImax) - vis.y(vis.DRImin)); });


			// HIGHLIGHT BAD ZONES
			vis.barsShame = vis.groupBars.selectAll(".rect.shame")
				.data(vis.displayData);
			vis.barsShame.exit().remove().transition().duration(trans);
			vis.barsShame.enter().append("rect")
				.attr("class","rect shame")
				.attr("y", function(d) { return vis.x(d.Key);})
				.attr("height", vis.x.rangeBand())
				.attr("fill", colorMedium);
			vis.barsShame.transition().duration(trans*2).delay(300)
				.attr("x", function(d) {
					if (d.Value < vis.DRImin) { return vis.margin.left; }
					else if (d.Value > vis.DRImax) { return vis.y(vis.DRImax); }
				})
				.attr("width", function(d) {
					if (d.Value < vis.DRImin) {return vis.y(d.Value) - vis.margin.left; }
					else if (d.Value > vis.DRImax) { return vis.y(d.Value) - vis.y(vis.DRImax);}
				})
				.attr("fill", function(d) {
					if ((d.Value < vis.DRImin || d.Value > vis.DRImax)/* && (vis.nutrient_type != "Protein (g)" && vis.nutrient_type != "Carbohydrate (g)" && vis.nutrient_type != "Fat (g)")*/) { return colorShame; }
					else { return colorMedium;}
				});

/*
			// LABEL reference line:
			vis.DRIlabel = vis.groupLabels.selectAll(".DRI_label")
				.data([{min:vis.DRImin, max:vis.DRImax}]);
			vis.DRIlabel.exit().remove();
			vis.DRIlabel.enter().append("text")
				.attr("class", "label DRI_label")
				.attr("y", vis.height + 11)
				.attr("text-anchor", "middle")
			vis.DRIlabel.transition().duration(trans*2).delay(300)
				.attr("x", function (d) {
					if (d.max==vis.yMax || d.min==d.max){ return vis.y(d.min); }
					else if (d.min==0) { return vis.y(d.max); }
					else { return (vis.y(d.max)+vis.y(d.min))/2; }
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
*/
		} else { //if Gender

				vis.lineRefMinMale = vis.groupRefLines.selectAll(".lineRefMinMale").data([vis.DRIminMale]);
				vis.lineRefMaxMale = vis.groupRefLines.selectAll(".lineRefMaxMale").data([vis.DRImaxMale]);
				vis.lineRefMinFemale = vis.groupRefLines.selectAll(".lineRefMinFemale").data([vis.DRIminFemale]);
				vis.lineRefMaxFemale = vis.groupRefLines.selectAll(".lineRefMaxFemale").data([vis.DRImaxFemale]);

				vis.lineRefMinMale.enter().append("line")
					.attr("class","lineRefMinMale")
					.style("stroke-width", 1)
					.style("stroke-dasharray", "2,2")
					.style("opacity", 0.5);
				vis.lineRefMaxMale.enter().append("line")
					.attr("class","lineRefMaxMale")
					.style("stroke-width", 1)
					.style("stroke-dasharray", "2,2")
					.style("opacity", 0.5);
				vis.lineRefMinFemale.enter().append("line")
					.attr("class","lineRefMinFemale")
					.style("stroke-width", 1)
					.style("stroke-dasharray", "2,2")
					.style("opacity", 0.5);
				vis.lineRefMaxFemale.enter().append("line")
					.attr("class","lineRefMaxFemale")
					.style("stroke-width", 1)
					.style("stroke-dasharray", "2,2")
					.style("opacity", 0.5);


				// Draw/update DRI line
				vis.svg.selectAll(".lineRefMinMale").transition().duration(trans)
					.style("stroke", "green")
					.style("opacity", function() {
						if (vis.DRIminMale==0 || vis.DRIminMale==vis.DRImaxMale) { return 0; }
						else { return 0.5; }
					})
					.attr("x1", function(){ return vis.y(vis.DRIminMale);})
					.attr("y1", 0)
					.attr("x2", function(){ return vis.y(vis.DRIminMale);})
					.attr("y2", vis.height/2);
				vis.svg.selectAll(".lineRefMaxMale").transition().duration(trans)
					.style("stroke", function() { if (vis.DRImaxMale != vis.yMax) { return colorDark; }})
					.attr("x1", function(){ return vis.y(vis.DRImaxMale);})
					.attr("y1", 0)
					.attr("x2", function(){ return vis.y(vis.DRImaxMale);})
					.attr("y2", vis.height/2);
				vis.svg.selectAll(".lineRefMinFemale").transition().duration(trans)
					.style("stroke", "green")
					.style("opacity", function() {
						if (vis.DRIminFemale==0 || vis.DRIminFemale==vis.DRImaxFemale) { return 0; }
						else { return 0.5; }
					})
					.attr("x1", function(){ return vis.y(vis.DRIminFemale);})
					.attr("y1", vis.height/2)
					.attr("x2", function(){ return vis.y(vis.DRIminFemale);})
					.attr("y2", function(d) { return vis.height });
				vis.svg.selectAll(".lineRefMaxFemale").transition().duration(trans)
					.style("stroke", function() { if (vis.DRImaxFemale != vis.yMax) { return colorDark; }})
					.attr("x1", function(){ return vis.y(vis.DRImaxFemale);})
					.attr("y1", vis.height/2)
					.attr("x2", function(){ return vis.y(vis.DRImaxFemale);})
					.attr("y2", function(d) { return vis.height });

				// TARGET zone Male
				vis.targetZoneMale = vis.OKzone.selectAll("rect.targetZoneMale")
					.data([vis.DRIminMale]);
				vis.targetZoneMale.exit().remove();
				vis.targetZoneMale.enter().append("rect")
					.attr("class","targetZoneMale")
					.attr("fill", greenZone);
				vis.targetZoneMale.transition().duration(trans)
					.attr("x", function(){ return vis.y(vis.DRIminMale); }	)
					.attr("y", 0)
					.attr("height", vis.height/2)
					.attr("width", function(){return (vis.y(vis.DRImaxMale) - vis.y(vis.DRIminMale)); });

				// TARGET zone Female
				vis.targetZoneFemale = vis.OKzone.selectAll("rect.targetZoneFemale")
					.data([vis.DRIminFemale]);
				vis.targetZoneFemale.exit().remove();
				vis.targetZoneFemale.enter().append("rect")
					.attr("class","targetZoneFemale")
					.attr("fill", greenZone);
				vis.targetZoneFemale.transition().duration(trans)
					.attr("x", function(){ return vis.y(vis.DRIminFemale); })
					.attr("y", vis.height/2)
					.attr("height", vis.height/2)
					.attr("width", function(){return (vis.y(vis.DRImaxFemale) - vis.y(vis.DRIminFemale)); });

				// Highlight for male
				vis.barsShameMale = vis.groupBars.selectAll(".rect.shameMale")
					.data(vis.displayData);
				vis.barsShameMale.exit().remove().transition().duration(trans);
				vis.barsShameMale.enter().append("rect")
					.attr("class","rect shameMale")
					.attr("y", function(d) { return vis.x(d.Key);})
					.attr("height", vis.x.rangeBand())
					.attr("fill", colorMedium);
				vis.barsShameMale.transition().duration(trans*2).delay(300)
					.attr("x", function(d) {
						if (d.Key=="Male" && d.Value < vis.DRIminMale) { return vis.margin.left; }
						else if (d.Key=="Male" && d.Value > vis.DRImaxMale) { return vis.y(vis.DRImaxMale); }
					})
					.attr("width", function(d) {
						if (d.Key=="Male" && d.Value < vis.DRIminMale) {return vis.y(d.Value) - vis.margin.left; }
						else if (d.Key=="Male" && d.Value > vis.DRImaxMale) { return vis.y(d.Value) - vis.y(vis.DRImaxMale);}
					})
					.attr("fill", function(d) {
						if (d.Key=="Male" && (d.Value < vis.DRIminMale || d.Value > vis.DRImaxMale) && (vis.nutrient_type != "Protein (g)" && vis.nutrient_type != "Carbohydrate (g)" && vis.nutrient_type != "Fat (g)")) { return colorShame; }
						else { return colorMedium;}
					});
				// Highlight for female
				vis.barsShameFemale = vis.groupBars.selectAll(".rect.shameFemale")
					.data(vis.displayData);
				vis.barsShameFemale.exit().remove().transition().duration(trans);
				vis.barsShameFemale.enter().append("rect")
					.attr("class","rect shameFemale")
					.attr("y", function(d) { return vis.x(d.Key);})
					.attr("height", vis.x.rangeBand())
					.attr("fill", colorMedium);
				vis.barsShameFemale.transition().duration(trans*2).delay(300)
					.attr("x", function(d) {
						if (d.Key=="Female" && d.Value < vis.DRIminFemale) { return vis.margin.left; }
						else if (d.Key=="Female" && d.Value > vis.DRImaxFemale) { return vis.y(vis.DRImaxFemale); }
					})
					.attr("width", function(d) {
						if (d.Key=="Female" && d.Value < vis.DRIminFemale) {return vis.y(d.Value) - vis.margin.left; }
						else if (d.Key=="Female" && d.Value > vis.DRImaxFemale) { return vis.y(d.Value) - vis.y(vis.DRImaxFemale);}
					})
					.attr("fill", function(d) {
						if (d.Key=="Female" && (d.Value < vis.DRIminFemale || d.Value > vis.DRImaxFemale) && (vis.nutrient_type != "Protein (g)" && vis.nutrient_type != "Carbohydrate (g)" && vis.nutrient_type != "Fat (g)")) { return colorShame; }
						else { return colorMedium;}
					});

			}
			// Print disclaimer
			var tempDisclaimer = nutrient_labels.filter(function(l) { return l.nutrient_type == vis.nutrient_type;})[0]["disclaimer"];
			$("#nutrient_disclaimer").html("* "+tempDisclaimer);
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
