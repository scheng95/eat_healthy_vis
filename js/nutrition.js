let driCalories = {
    "Male": {
        "Active": {},
        "Moderately Active": {},
        "Sedentary": {}
    },
    "Female": {
        "Active": {},
        "Moderately Active": {},
        "Sedentary": {}
    }
};

(function dataInit() {
    // TODO this should go in some kind of initialization, don't do it each time
    d3.csv("data_raw/dri_calories.csv", function(data) {
        // transform in to object indexed by gender, age, activity
        data.forEach(function(d) {
            driCalories[d.Gender]["Active"][d["Age (years)"]] = +d["Active"];
            driCalories[d.Gender]["Moderately Active"][d["Age (years)"]] = +d["Moderately Active"];
            driCalories[d.Gender]["Sedentary"][d["Age (years)"]] = +d["Sedentary"];
        });

    });
})();

let currRecipes = [];
let selectRecipes = {};
let recipeCount = 0;

// TODO take these functions out of the global namespace
function nutritionAnalysis(recipe) {
    const app_id = "11d4d52e";
    const app_key = "2d7e359cd72a42a1da103d23be96280d";

    // var proxyUrl = "http://localhost:5000/n";
    const git = "https://flaskwebproject120161124101015.scm.azurewebsites.net:443/flaskwebproject120161124101015.git";
    const baseUrl = "http://flaskwebproject120161124101015.azurewebsites.net/n";

    const payload = {
        "app_id": app_id,
        "app_key": app_key,
        "recipe": JSON.stringify(recipe)
    };

    return $.post(proxyUrl, payload, function(data, status) {
        console.log(status);
        return data;
    });
}

function recipeSearch(query) {
    // first, clear all current results
    $("#recipe-results").empty()
        .addClass("loader");

    const app_id = "58b4a2d1";
    const app_key = "6632220a737740e2eeb51be026a62788";

    // var baseUrl = "http://edamamproxy.azurewebsites.net/r";
    const baseUrl = "http://flaskwebproject120161124101015.azurewebsites.net/r";
    // var baseUrl = "http://localhost:5000/r";

    const proxyUrl = baseUrl + `?q=${query}&app_id=${app_id}&app_key=${app_key}`;

    $.get(proxyUrl, function(data, status) {
        console.log(status);
        $("#recipe-results").removeClass("loader");
        displayRecipes(JSON.parse(data));
    });
}

function displayRecipes(data) {
    let resultsHTML = "";

    if (data.hits.length <= 0) {
        resultsHTML = "<h4 class='text-center'>No Results</h4>";
    } else {
        // TODO if no results returned, display message
        const numDisplay = 6;
        currRecipes = data.hits.slice(0, numDisplay).map(d => d.recipe);
        currRecipes.forEach(function(recipe, i) {
            // TODO can do this better with a reduce
            let ingredientsListHTML = "";
            recipe.ingredientLines.forEach(function(ing) {
                ingredientsListHTML += `<li><a>${ing}</a></li>`;
            });

            const ingredientsHTML =
            `<div class="dropdown dropdown-ingredients">
                <button class="btn btn-default dropdown-toggle" type="button" id="ingredients-dropdown-${i}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">Ingredients<span class="caret"></span></button>
                <ul class="dropdown-menu" aria-labelledby="ingredients-dropdown-${i}">
                    ${ingredientsListHTML}
                </ul>
            </div>`;

            resultsHTML +=
            `<div class="col-md-4">
                <div class="thumbnail">
                    <a href="${recipe.url}" target="_blank"><img src="${recipe.image}" alt="${recipe.label}"></a>
                    <div class="caption">
                        <h5 class="recipe-title" title="${recipe.label}">${recipe.label}</h5>
                        <p>
                            Serves ${recipe.yield}
                            <br>
                            <!-- TODO handle overflow here? -->
                            Calories/serving: ${Math.floor(recipe.calories / recipe.yield)}
                        </p>
                        ${ingredientsHTML}
                        <p><button class="btn btn-primary add-recipe-button" type="button" id="recipe-add-button-${i}" onclick="addRecipe(${i})">Add to menu</button></p>
                    </div>
                </div>
            </div>`;
        });
    }
    // TODO allow users to search for more recipes with same query?

    $("#recipe-results").append("<div class='row'>" + resultsHTML + "</div>");
}

function addRecipe(selectIdx) {
    if (Object.keys(selectRecipes).length >= 15) {
        console.log("over limit");
        return false;
    }
    const recipe = currRecipes[selectIdx];
    const currIdx = recipeCount;
    selectRecipes[currIdx] = recipe;

    const newMenuItem =
    `<div class="panel-heading">
        <h4 class="panel-title"><a data-toggle="collapse" data-parent="#accordion-menu" href="#collapse${currIdx}">
            ${recipe.label}</a></h4>
    </div>
    <div id="collapse${currIdx}" class="panel-collapse collapse">
        <div class="panel-body">
            <a href="${recipe.url}" target="_blank"><img src="${recipe.image}" alt="${recipe.label}"></a>
            <p>
                Serves ${recipe.yield}
                <br>
                <!-- TODO handle overflow here? -->
                Calories/serving: ${Math.floor(recipe.calories / recipe.yield)}
            </p>
            <p><button class="btn btn-primary remove-recipe-button" type="button" id="recipe-remove-button-${currIdx}" onclick="removeRecipe(${currIdx})">Remove</button></p>
        </div>
    </div>`;

    $("#accordion-menu").append(`<div class="panel panel-default" id="menu-panel-${currIdx}">${newMenuItem}</div>`);

    recipeCount += 1;

    wrangleMenuData();
}

function removeRecipe(idx) {
    // remove from stored recipes
    delete selectRecipes[idx];
    // remove rom DOM
    $(`#menu-panel-${idx}`).remove();

    wrangleMenuData();
}

function wrangleMenuData() {
    console.log("wrangleMenuData");
    // TODO wrangle data in selectRecipes

    // TODO get values
    let age = $("#input-age").val();
    let gender = $("#dropdown-gender").val();
    let lifestyle = $("#dropdown-lifestyle").val();

    let nutrientCodes = {
        "ENERC_KCAL": "Calories",
        "FAT": "Fat (g)",
        "NA": "Sodium (mg/d)",
        "PROCNT": "Protein (g)",
        "SUGAR": "Sugar (g)",
        "CHOCDF": "Carbohydrate (g)",
        "FIBTG": "Fiber (g)"
    };
    let itemNutrients = [];
    let totIntake = {
        "Calories": 0,
        "Fat (g)": 0,
        "Sodium (mg/d)": 0,
        "Protein (g)": 0,
        "Sugar (g)": 0,
        "Carbohydrate (g)": 0,
        "Fiber (g)": 0
    };
    for (let key in selectRecipes) {
        if (selectRecipes.hasOwnProperty(key)) {
            const recipe = selectRecipes[key];
            const totNuts = recipe.totalNutrients;
            // TODO only assuming one serving here
            const servings = recipe.yield;
            let itemNut = {};
            for (let code in nutrientCodes) {
                if (totNuts.hasOwnProperty(code)) {
                    totIntake[nutrientCodes[code]] += totNuts[code]["quantity"] / servings;
                    itemNut[nutrientCodes[code]] = totNuts[code]["quantity"] / servings;
                } else {
                    itemNut[nutrientCodes[code]] = 0;
                }
            }
            itemNutrients.push(itemNut);
        }
    }

    console.log(totIntake);

    const recCal = driCalories[gender][lifestyle][age];
    const totCal = totIntake["Calories"];

    let displayData = [];

    const indNuts = [
        "Fiber (g)",
        "Sugar (g)",
        "Sodium (mg/d)"
    ];
    const depNuts = [
        "Fat (g)",
        "Carbohydrate (g)",
        "Protein (g)"
    ];
    // calculate macro limits based on recommended calorie consumption
    const depNutsFactor = {
        "Fat (g)": 0.25 / 9,
        "Carbohydrate (g)": 0.45 / 4,
        "Protein (g)": 0.3 / 4
    };

    d3.csv("data_raw/dri_all.csv", function(error, driData) {
        const recs = driData.filter(function(d) { return d["Gender"] === gender && d["Age"] == age; })[0];
        indNuts.forEach(function(d) {
            displayData.push({
                "slice": 1,
                "name": d,
                "limit": +recs[d],
                "tot": totIntake[d]
            })
        });
        depNuts.forEach(function(d) {
            displayData.push({
                "slice": 1,
                "name": d,
                "limit": recCal * depNutsFactor[d],
                "tot": totIntake[d]
            })
        });
        console.log(displayData);
        updateNutritionVis({
            "calData": [{
                "tot": totCal,
                "rec": recCal
            }],
            "nutData": displayData
        });
    });
}

// top margin space for the calories bar
let margin = {top: 80, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

let svg = d3.select("#menu-vis").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

let svgPie = svg.append("g")
    // center the pie
    .attr("class", "pie-group")
    .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");

let svgBar = svg.append("g")
// center the pie
    .attr("class", "bar-group")
    .attr("transform", "translate(" + margin.left + ",0)");

const absMaxRad = Math.min(width, height) / 2;
const maxRad = absMaxRad * 0.7;

// TODO decide where this should actually go
function updateNutritionVis(data) {
    const calData = data.calData;
    const displayData = data.nutData;

    console.log("updateNVis");

    let color = d3.scale.ordinal()
        .domain([0, 5])
        .range(colorbrewer.RdBu[6]);

    // don't define outer radius yet
    let arc = d3.svg.arc()
        .innerRadius(0);

    let labelArc = d3.svg.arc()
        .outerRadius(maxRad - 40)
        .innerRadius(maxRad - 40);

    let pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.slice; });

    let groups = svgPie.selectAll(".arc")
        .data(pie(displayData));
    let g = groups.enter().append("g")
        .attr("class", "arc");

    // background, only draw once
    g.append("path")
        .attr("class", "background-arc")
        .attr("d", function(d, i) { return arc.outerRadius(maxRad)(d, i); })
        .style("fill", "Lightgray");

    let pieGrads = svgPie.append("defs").selectAll("radialGradient").data(pie(displayData))
        .enter().append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "100%")
        .attr("id", function(d, i) { return "grad" + i; });
    pieGrads.append("stop").attr("offset", "19%").style("stop-color", function(d, i) { return color(i); });
    pieGrads.append("stop").attr("offset", "25%").style("stop-color", "white");

    g.append("path")
        .attr("class", "foreground-arc")
        // .style("fill", function(d, i) { return color(i); });
        .style("fill", function(d, i) { return "url(#grad" + i + ")"; });

    // update
    groups.select(".foreground-arc")
        .transition()
        .duration(1000)
        .attr("d", function(d, i) { return arc.outerRadius(Math.sqrt(maxRad*maxRad * (d.data.tot / d.data.limit)))(d, i); });

    // draw boundaries
    g.append("circle")
        .attr("class", "outline-circle")
        .attr("r", maxRad)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 1)
        .attr("stroke", "Gray")
        .attr("stroke-dasharray", "10, 5");

    // labels, only draw once
    g.append("text")
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) { return d.data.name; });

    //////// draw calories bar
    let barScale = d3.scale.linear()
        .domain([0, calData[0]["rec"]])
        .range([0, width * 0.6]);

    let bars = svgBar.selectAll(".bars")
        .data(calData);
    let bargroup = bars.enter().append("g")
        .attr("class", "bars");

    const barHeight = 30;
    const barColor = "Cyan";

    // background, only draw once
    bargroup.append("rect")
        .attr("class", "background-bar")
        .attr("x", 0.1 * width)
        .attr("y", margin.top/2 - barHeight/2)
        .attr("width", d => barScale(d.rec))
        .attr("height", barHeight)
        .attr("fill", "Lightgray");

    let barGrads = svgBar.append("defs").selectAll("linearGradient").data(calData)
        .enter().append("linearGradient")
        .attr("id", "bar-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
    barGrads.append("stop").attr("offset", "70%").style("stop-color", barColor);
    barGrads.append("stop").attr("offset", "80%").style("stop-color", "White");

    // foreground
    bargroup.append("rect")
        .attr("class", "foreground-bar")
        .attr("x", 0.1 * width)
        .attr("y", margin.top/2 - barHeight/2)
        .attr("height", barHeight)
        .attr("fill", "url(#bar-gradient)");
    // update
    bars.select(".foreground-bar")
        .transition()
        .duration(1000)
        .attr("width", d => barScale(d.tot));

    // draw boundaries
    bargroup.append("rect")
        .attr("class", "outline-rect")
        .attr("x", 0.1 * width)
        .attr("y", margin.top/2 - barHeight/2)
        .attr("width", d => barScale(d.rec))
        .attr("height", barHeight)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 1)
        .attr("stroke", "Gray")
        .attr("stroke-dasharray", "10, 5");

    // labels, only draw once
    bargroup.append("text")
        .attr("x", 0.1 * width + 5)
        .attr("y", margin.top/2)
        .attr("dy", ".35em")
        .text("Calories");

}
