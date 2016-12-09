var parseDate = d3.time.format("%Y").parse; // Date parser to convert strings to date objects
var nutrients = ["Calories (kcal)","Protein (g)","Carbohydrate (g)","Sugar (g)","Fiber (g)","Fat (g)","Saturated Fat (g)","Monounsaturated Fat (g)","Polyunsaturated Fat (g)","Cholesterol (mg)","Vitamin E (mg)","Vitamin A (mg)","Vitamin C (mg)","Calcium (mg)","Magnesium (mg)","Iron (mg)","Sodium (mg)","Potassium (mg)","Folate (mcg)","Caffeine (mg)","Alcohol (g)"]
var years = ["2001","2003","2005","2007","2009","2011","2013"];
var data0;
var FAFH_chart, timeSeriesChart, incomeChart, genderChart, timeline; // Visualization instances
var colorFAFH = "#f66"; var colorFAH = "#6f6";
var colorLightest = "#3DC3CC";
var colorLight = "#00BFCC";
var colorMedium = "#2D8E95";
var colorDark = "#00777F";
var colorDarkest = "#00484C";
var trans = 400;

// Start app by loading  data
loadData();

// Scroll to div\
$("#buttonToB").click(function() {
    $('html,body').animate({
        scrollTop: $("#B").offset().top},'slow');
});

function loadData() {
	/* FAFH
	d3.csv("data/food_expenditures_1929-2014.csv", function(error, dataIncome){
		if(!error){
			data_FAFH = dataIncome.map(function(d){
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
	*/
	d3.queue()
		.defer(d3.csv, "data/Income.csv")
		.defer(d3.csv, "data/Gender.csv")
		.defer(d3.csv, "data/DRI_min.csv")
		.defer(d3.csv, "data/DRI_max.csv")
		.await(function(error, _dataIncome, _dataGender, _dataDRImin, _dataDRImax) {
	    if (error) { console.error('Something went wrong: ' + error); }
	    else {
				var dataTypes = ["Income","Gender","DRImin","DRImax"];
				var keys = {
					Income: Object.keys(_dataIncome[0]),
					Gender: Object.keys(_dataGender[0]),
					DRImin: Object.keys(_dataDRImin[0]),
					DRImax: Object.keys(_dataDRImax[0])
				};
				data0 = {
					Income: _dataIncome,
					Gender: _dataGender,
					DRImin: _dataDRImin,
					DRImax: _dataDRImax
				};
				// Convert all numerical values to numbers
				dataTypes.forEach(function(dataType) {
					data0[dataType].forEach(function(d){
						keys[dataType].forEach(function(key) {
							// Does it matter if we format years as a number instead of a date obj?
							if (key!="Income" && key!="Age" && key!="Gender"){ d[key] = +d[key]; }
						});
					});
				});

				createVis();

				/* FAH and FAFH areachart data
				years.forEach(function(y) {
					data_incomeByYear[y] = data_income.filter(function(d){ return d.Year == y;})
				});
				income_groups.forEach(function(i) {
					data_incomeByIncome[i] = data_income.filter(function(d){ return d.Income == i;})
				});
				nutrients.forEach(function(nutrient){
					data_incomeByNutrient[nutrient] = data_income.map(function(d){
						return {
							Year: d.Year,
							Income: d.Income,
							Age: d.Age,
							nutrient: d[nutrient]
						}
					});
				})
				*/
	  	}
		});
}

function createVis() {
		//FAFH_chart = new StackedAreaChart("areachart_FAFH", data_FAFH);
    timeSeriesChart = new TimeSeriesChart("timeSeriesChart_WWEIA", data0.Income, data0.Gender, data0.DRImin, data0.DRImax);
		updateVis();
}

function updateVis() {
		timeSeriesChart.updateVis();
}


function brushed() {
	// TO-DO: React to 'brushed' event
}
