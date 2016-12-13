var nutrient_type;
var parseDate = d3.time.format("%Y").parse; // Date parser to convert strings to date objects
var nutrients = ["Calories (kcal)","Protein (g)","Carbohydrate (g)","Sugar (g)","Fiber (g)","Fat (g)","Saturated Fat (g)","Monounsaturated Fat (g)","Polyunsaturated Fat (g)","Cholesterol (mg)","Vitamin E (mg)","Vitamin A (mg)","Vitamin C (mg)","Calcium (mg)","Magnesium (mg)","Iron (mg)","Sodium (mg)","Potassium (mg)","Folate (mcg)","Caffeine (mg)","Alcohol (g)"]
var years = ["2001","2003","2005","2007","2009","2011","2013"];
var data0;
var FAFH_chart, timeSeriesChart, incomeChart, genderChart, timeline; // Visualization instances
var nutrient_labels;
var colorFAFH = "#f66"; var colorFAH = "#6f6";
var colorLightest = "#3DC3CC";
var colorLight = "#00BFCC";
var colorMedium = "#2D8E95";
var colorDark = "#00777F";
var colorDarkest = "#00484C";
var trans = 400;

// Start app by loading  data
loadData();

window.onload = function() {

  var Calories = $("#Calories");
  var Protein = $("#Protein");
  var Carbohydrate = $("#Carbohydrate");
  var Sugar = $("#Sugar");
  var Fat = $("#Fat");
  var Saturated_Fat = $("#Saturated_Fat");
  var Cholesterol = $("#Cholesterol");
  var Fiber = $("#Fiber");
  var Sodium = $("#Sodium");
  var Vitamin_A = $("#Vitamin_A");
  var Vitamin_C = $("#Vitamin_C");
  var Vitamin_E = $("#Vitamin_E");
  var Calcium = $("#Calcium");
  var Iron = $("#Iron");

  var child1 = $("#2-5");
  var child2 = $("#6-11");
  var child3 = $("#12-19");
  var adult = $("#20andover");

  var nutrient_triggers = [Calories, Protein, Carbohydrate, Sugar, Fat,
  Saturated_Fat, Cholesterol, Fiber, Sodium, Cholesterol,
  Vitamin_A, Vitamin_C, Vitamin_E, Calcium, Iron];
  var age_triggers = [child1, child2, child3, adult];

  nutrient_triggers.forEach(function(nutrient_trigger) {
    nutrient_trigger.click(function() {
      var nutrient_type = nutrient_trigger.text();
      if (timeSeriesChart != null) {
        timeSeriesChart.nutrient_type = nutrient_type;
        timeSeriesChart.updateVis();
      }
      return false;
    });
  })

  age_triggers.forEach(function(age_trigger) {
    age_trigger.click(function() {
      console.log(age_trigger);
      var age_group = age_trigger.text();
      if (age_group=="2 - 5") { age_group = "2-5";}
      if (age_group=="6 - 11") { age_group = "6-11";}
      if (age_group=="12 - 19") { age_group = "12-19";}
      if (timeSeriesChart != null) {
        timeSeriesChart.age_group = age_group;
        timeSeriesChart.updateVis();
      }
      return false;
    });
  })


  $("#Fiber0").click(function() {
    if (timeSeriesChart != null) {
      timeSeriesChart.nutrient_type = "Fiber";
      timeSeriesChart.updateVis();
    }
    $("#Fiber").addClass("active");
    $("#Fiber").siblings().removeClass("active");
    return false;
  });
  $("#Sugar0").click(function() {
    if (timeSeriesChart != null) {
      timeSeriesChart.nutrient_type = "Sugar";
      timeSeriesChart.updateVis();
    }
    $("#Sugar").addClass("active");
    $("#Sugar").siblings().removeClass("active");
    return false;
  });
  $("#Sodium0").click(function() {
    if (timeSeriesChart != null) {
      timeSeriesChart.nutrient_type = "Sodium";
      timeSeriesChart.updateVis();
    }
    $("#Sodium").addClass("active");
    $("#Sodium").siblings().removeClass("active");
    return false;
  });


  $(".btn-group > a").click(function(){
    $(this).addClass("active");
    $(this).siblings().removeClass("active");
    //$(this).parent().parent().siblings().children().children().not(this).removeClass("active");
  });
}
// Scroll to div\
$(".scrollToB").click(function() {
    $('html,body').animate({
        scrollTop: $("#B").offset().top},'slow');
});
$(".scrollToC").click(function() {
    $('html,body').animate({
        scrollTop: $("#C").offset().top},'slow');
});
$(".scrollToD").click(function() {
    $('html,body').animate({
        scrollTop: $("#D").offset().top},'slow');
});
$(".scrollToRef").click(function() {
    $('html,body').animate({
        scrollTop: $("#footer").offset().top},'slow');
});

function loadData() {

	d3.queue()
		.defer(d3.csv, "data/Income.csv")
		.defer(d3.csv, "data/Gender.csv")
		.defer(d3.csv, "data/DRI_min.csv")
		.defer(d3.csv, "data/DRI_max.csv")
    .defer(d3.csv, "data/DRI_labels.csv")
		.await(function(error, _dataIncome, _dataGender, _dataDRImin, _dataDRImax, _dataDRIlabels) {
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

        nutrient_labels = _dataDRIlabels.map (function(d) {
          return {
            nutrient_type: d["Nutrient Type"],
            nutrient: d["Nutrient"],
            unit: d["Unit"],
            disclaimer: d["Disclaimer"]
          };
        })
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
