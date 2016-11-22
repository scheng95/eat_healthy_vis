var data_FAFH = [];
var parseDate = d3.time.format("%Y").parse; // Date parser to convert strings to date objects
var areachart, timeline; // Visualization instances
var colorFAFH = "#f66";
var colorFAH = "#6f6";

// Start app by loading  data
loadData();
console.log("test");

function loadData() {
	d3.csv("data/food_expenditures_1929-2014.csv", function(error, csvData){
		if(!error){
			data_FAFH = csvData.map(function(d){
				return {
					Year: parseDate(d.Year),
					values: {
            FAFH: +d.FAFH, FAH: +d.FAH
        	}
				};
			});
			createVis();
		}
	});
}


function createVis() {
		FAFHchart = new StackedAreaChart("areachart-FAFH", data_FAFH);
}


function brushed() {
	// TO-DO: React to 'brushed' event
}
