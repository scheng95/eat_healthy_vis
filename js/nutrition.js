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
                <button class="btn btn-primary add-recipe-button pull-right" type="button" id="recipe-add-button-${i}" onclick="addRecipe(${i})">Add</button>
            </div>`;

            resultsHTML +=
            `<div class="col-md-6 thumb-container">
                <div class="thumbnail">
                    <div class="row thumb-grid">
                        <div class="col-md-4 thumb-image">
                            <a href="${recipe.url}" target="_blank"><img src="${recipe.image}" alt="${recipe.label}"></a>
                        </div>
                        <div class="col-md-8 thumb-text">
                            <div class="caption">
                                <h5 class="recipe-title" title="${recipe.label}">${recipe.label}</h5>
                                <p>
                                    Serves ${recipe.yield} | Calories/serving: ${Math.floor(recipe.calories / recipe.yield)}
                                    <!-- TODO handle overflow here? -->
                                </p>
                                  ${ingredientsHTML}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
    }
    // TODO allow users to search for more recipes with same query?

    $("#recipe-results").append("<div class='row'>" + resultsHTML + "</div>");
}

function addRecipe(selectIdx) {
    if (Object.keys(selectRecipes).length >= 12) {
        console.log("over limit");
        return false;
    }
    const recipe = currRecipes[selectIdx];
    const currIdx = recipeCount;
    selectRecipes[currIdx] = recipe;

    const newMenuItem =
    `<div class="panel-heading">
        <div class="row">
            <div class="col-md-11">
                <h4 class="panel-title">
                    <a data-toggle="collapse" data-parent="#accordion-menu" href="#collapse${currIdx}">${recipe.label}</a>
                </h4>
            </div>
            <div class="col-md-1">
                <span class="clickable glyphicon glyphicon-remove-circle" onclick="removeRecipe(${currIdx})"></span>
            </div>
        </div>
    </div>
    <div id="collapse${currIdx}" class="panel-collapse collapse">
        <div class="panel-body">
            <p>
                <a href="${recipe.url}" target="_blank"><img src="${recipe.image}" alt="${recipe.label}"></a>
            </p>
            Serves ${recipe.yield}
            <br>
            <!-- TODO handle overflow here? -->
            Calories/serving: ${Math.floor(recipe.calories / recipe.yield)}
        </div>
    </div>`;

    const staticMenuItem =
    `<div class="panel-heading">
        <div class="row">
            <div class="col-md-11">
                <h4 class="panel-title clickable" onclick="pieHighlight(${currIdx})">
                    ${recipe.label}
                </h4>
            </div>
            <div class="col-md-1">
                <span class="clickable glyphicon glyphicon-remove-circle" onclick="removeRecipe(${currIdx})"></span>
            </div>
        </div>
     </div>`;

    $("#accordion-menu").append(`<div class="panel panel-default" id="menu-panel-${currIdx}">${newMenuItem}</div>`);
    // TODO this is super bad, but just do it for now
    $("#static-menu").append(`<div class="panel panel-default" id="static-menu-panel-${currIdx}">${staticMenuItem}</div>`);

    recipeCount += 1;

    wrangleMenuData();
}

function removeRecipe(idx) {
    // remove from stored recipes
    delete selectRecipes[idx];
    // remove from DOM
    $(`#menu-panel-${idx}`).remove();
    $(`#static-menu-panel-${idx}`).remove();

    wrangleMenuData();
}

let detailIndex = new Set();

function pieHighlight(idx) {
    console.log(idx);

    // TODO change how dom looks
    if (detailIndex.has(idx)) {
        $(`#static-menu-panel-${idx}`).removeClass("highlighted");
        detailIndex.delete(idx);
    } else {
        $(`#static-menu-panel-${idx}`).addClass("highlighted");
        detailIndex.add(idx);
    }

    wrangleMenuData();
}

function wrangleMenuData() {
    console.log("wrangleMenuData");

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
    let itemNutrients = {};
    let totIntake = {
        "Calories": 0,
        "Fat (g)": 0,
        "Sodium (mg/d)": 0,
        "Protein (g)": 0,
        "Sugar (g)": 0,
        "Carbohydrate (g)": 0,
        "Fiber (g)": 0
    };
    let selectIntake = $.extend(true, {}, totIntake);
    for (let key in selectRecipes) {
        if (selectRecipes.hasOwnProperty(key)) {
            const recipe = selectRecipes[key];
            const totNuts = recipe.totalNutrients;
            // TODO only assuming one serving here
            const servings = recipe.yield;
            let itemNut = {};
            for (let code in nutrientCodes) {
                if (totNuts.hasOwnProperty(code)) {
                    const perServNutrient = totNuts[code]["quantity"] / servings;
                    totIntake[nutrientCodes[code]] += perServNutrient;
                    itemNut[nutrientCodes[code]] = perServNutrient;
                    if (detailIndex.has(parseInt(key))) {
                        selectIntake[nutrientCodes[code]] += perServNutrient;
                    }
                } else {
                    itemNut[nutrientCodes[code]] = 0;
                }
            }
            itemNutrients[key] = itemNut;
        }
    }

    // aggregate nutrient info for selected items

    // console.log(totIntake);

    const recCal = driCalories[gender][lifestyle][age];
    const totCal = totIntake["Calories"];
    const subCal = selectIntake["Calories"];

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
                "tot": totIntake[d],
                "subset": selectIntake[d]
            })
        });
        depNuts.forEach(function(d) {
            displayData.push({
                "slice": 1,
                "name": d,
                "limit": recCal * depNutsFactor[d],
                "tot": totIntake[d],
                "subset": selectIntake[d]
            })
        });
        // console.log(displayData);
        updateNutritionVis({
            "calData": [{
                "tot": totCal,
                "rec": recCal,
                "sub": subCal
            }],
            "nutData": displayData
        });
    });
}

// top margin space for the calories bar
let margin = {top: 80, right: 0, bottom: 0, left: 0},
    width = 1040/12*9 - margin.left - margin.right,
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

    console.log(data);

    let color = d3.scale.ordinal()
        .domain([0, 5])
        .range(colorbrewer.Set2[6]);

    // TODO should this be here?
    let radScale = (r, rmax) => Math.max(Math.sqrt(maxRad*maxRad * (r / rmax)), 0.00001);

    // don't define outer radius yet
    let arc = d3.svg.arc()
        .innerRadius(0);

    let labelArc = d3.svg.arc()
        .outerRadius(maxRad - 40)
        .innerRadius(maxRad - 40);

    let pie = d3.layout.pie()
        .sort(null)
        .value(d => d.slice);

    let groups = svgPie.selectAll(".arc")
        .data(pie(displayData));
    let g = groups.enter().append("g")
        .attr("class", "arc");
    groups.exit()
        .transition().duration(1000)
        .remove();
    // background, only draw once
    g.append("path")
        .attr("class", "background-arc")
        .attr("d", d => arc.outerRadius(maxRad)(d));

    // TODO only need to append defs once
    // definitions for gradient fill
    let pieGrads = svgPie.append("defs").selectAll("radialGradient").data(pie(displayData))
        .enter().append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "100%")
        .attr("id", function(d, i) { return "grad" + i; });
    pieGrads.append("stop").attr("offset", "22%").style("stop-color", function(d, i) { return color(i); });
    pieGrads.append("stop").attr("offset", "28%").style("stop-color", "white");

    // draw new slice
    g.append("path")
        .attr("class", "foreground-arc")
        // .style("fill", function(d, i) { return color(i); });
        .style("fill", (d, i) => "url(#grad" + i + ")");
    // update
    groups.select(".foreground-arc")
        .transition()
        .duration(1000)
        .attr("d", d => arc.outerRadius(radScale(d.data.tot, d.data.limit))(d));

    // draw selected slices
    g.append("path")
        .attr("class", "overlay-arc");
    groups.select(".overlay-arc")
        .transition().duration(1000)
        .attr("d", d => arc.outerRadius(radScale(d.data.subset, d.data.limit))(d));

    // draw outline over everything else
    g.append("path")
        .attr("class", "outline-arc")
        .attr("d", d => arc.outerRadius(maxRad)(d));

    // labels, only draw once
    g.append("text")
        .attr("class", "pie-label")
        .attr("transform", d => "translate(" + labelArc.centroid(d) + ")")
        .attr("dy", ".35em")
        .text(d => d.data.name);

    //////// draw calories bar
    let barScale = d3.scale.linear()
        .domain([0, calData[0]["rec"]])
        .range([0, width * 0.6]);

    let bars = svgBar.selectAll(".bars")
        .data(calData);
    let bargroup = bars.enter().append("g")
        .attr("class", "bars");

    const barHeight = 30;
    const barColor = "rgb(45, 142, 149)";

    // background, only draw once
    bargroup.append("rect")
        .attr("class", "background-bar")
        // TODO refactor these x, y
        .attr("x", d => (width - barScale(d.rec)) / 2)
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
    barGrads.append("stop").attr("offset", "80%").style("stop-color", barColor);
    barGrads.append("stop").attr("offset", "85%").style("stop-color", "White");

    // foreground
    bargroup.append("rect")
        .attr("class", "foreground-bar")
        .attr("x", d => (width - barScale(d.rec)) / 2)
        .attr("y", margin.top/2 - barHeight/2)
        .attr("height", barHeight)
        .attr("fill", "url(#bar-gradient)");
    // update
    bars.select(".foreground-bar")
        .transition()
        .duration(1000)
        .attr("width", d => barScale(d.tot));

    // draw overlay
    bargroup.append("rect")
        .attr("class", "overlay-bar")
        .attr("x", d => (width - barScale(d.rec)) / 2)
        .attr("y", margin.top/2 - barHeight/2)
        .attr("height", barHeight);
    // update
    bars.select(".overlay-bar")
        .transition()
        .duration(1000)
        .attr("width", d => barScale(d.sub));

    // draw boundaries
    bargroup.append("rect")
        .attr("class", "outline-rect")
        .attr("x", d => (width - barScale(d.rec)) / 2)
        .attr("y", margin.top/2 - barHeight/2)
        .attr("width", d => barScale(d.rec))
        .attr("height", barHeight)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 1)
        // .attr("stroke-dasharray", "10, 5")
        .attr("stroke", "Gray");

    // labels, only draw once
    bargroup.append("text")
        .attr("class", "calorie-label")
        .attr("x", d => (width - barScale(d.rec)) / 2 + 5)
        .attr("y", margin.top/2)
        .attr("dy", ".35em")
        .text("Calories");

}

