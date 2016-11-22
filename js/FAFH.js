StackedAreaChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
  this.data = _data;
	//console.log(this.data);

  this.initVis();
}

// Stacked Area Chart
StackedAreaChart.prototype.initVis = function(){
	var vis = this;
	var width = $("#"+vis.parentElement).width();
	vis.margin = { top: 40, right: 40, bottom: 60, left: 60 };
	vis.width = width - vis.margin.left - vis.margin.right,
  vis.height = width - vis.margin.top - vis.margin.bottom;
	vis.colorScale = d3.scale.category20()
		.domain(["FAFH","FAH"])
		.range(["#ca0020","#92c5de"]);

  // SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Scales and axes
  vis.x = d3.time.scale()
  	.range([0, vis.width])
  	.domain(d3.extent(vis.data, function(d) { return d.Year; }));

	vis.y = d3.scale.linear()
		.range([vis.height, 0])
    .domain([0, 100]);

	vis.xAxis = d3.svg.axis()
		  .scale(vis.x)
		  .orient("bottom");

	vis.yAxis = d3.svg.axis()
	    .scale(vis.y)
	    .orient("left");

	vis.svg.append("g")
	    .attr("class", "x-axis axis")
	    .attr("transform", "translate(0," + vis.height + ")");

	vis.svg.append("g")
			.attr("class", "y-axis axis");

	// TO-DO: Initialize stack layout
	var stack = d3.layout.stack()
	    .values(function(d) { return d.values; });

	var dataCategories = vis.colorScale.domain();
	var transposedData = dataCategories.map(function(category) {
		return {
				category: category,
				values: vis.data.map(function(d) {
						return {Year: d.Year, y: d.values[category]};
				})
		};
	});
	vis.stackedData = stack(transposedData);
	console.log(vis.stackedData);

	vis.area = d3.svg.area()
		.interpolate("cardinal")
		.x(function(d) { return vis.x(d.Year); })
		.y0(function(d) { return vis.y(d.y0); })
		.y1(function(d) { return vis.y(d.y0 + d.y); });


	// TO-DO: Tooltip placeholder
	// TO-DO: Filter data
  vis.updateVis();
}



// Update visualization
StackedAreaChart.prototype.updateVis = function(){
	var vis = this;

	// Update domain
	//vis.x.domain();

	// Draw the layers
	var categories = vis.svg.selectAll(".area")
      .data(vis.stackedData);

  categories.enter().append("path")
      .attr("class", "area");

  categories
  		.style("fill", function(d) {
  			return vis.colorScale(d.category);
  		})
      .attr("d", function(d) {
				return vis.area(d.values);
      })

	//categories.exit().remove();

	// Call axis functions with the new domain
	vis.svg.select(".x-axis").call(vis.xAxis);
  vis.svg.select(".y-axis").call(vis.yAxis);

	// TO-DO: Update tooltip text
}
