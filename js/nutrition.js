MealPlanner = function() {
    this.initVis();
};

MealPlanner.prototype.initVis = function() {
    let vis = this;

    // top margin space for the calories bar
    vis.margin = {top: 80, right: 0, bottom: 0, left: 0};
    vis.width = 1040/12*9 - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#menu-vis").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);
    // .style("background-color", "cyan");

    vis.pieCenterY = vis.margin.top + vis.height/2 - 30;

    vis.svgPie = vis.svg.append("g")
        .attr("class", "pie-group")
        .attr("transform", "translate(" + (vis.margin.left + vis.width / 2 - 140) + "," + vis.pieCenterY + ")");

    vis.svgBar = vis.svg.append("g")
        .attr("class", "bar-group")
        .attr("transform", "translate(" + vis.margin.left + ",0)");

    vis.absMaxRad = Math.min(vis.width, vis.height) / 2;
    vis.maxRad = vis.absMaxRad * 0.7;

    vis.menuLimit = 12;
    vis.queryLimit = 6;
    vis.detailIndex = new Set();

    vis.currRecipes = [];
    vis.selectRecipes = {};
    vis.recipeCount = 0;

    // let color = d3.scale.ordinal()
    //     .domain([0, 5])
    //     .range(colorbrewer.Set2[6]);

    // color scale for good/bad in pie
    const goodColor = "rgb(147, 229, 221)";
    const medColor = "rgb(255, 240, 156)";
    const badColor = "rgb(224, 86, 16)";
    // TODO don't hard code so much
    vis.color = function(d) {
        const ratio = d.data.tot / d.data.limit;
        let fillColor;
        if (d.data.name in {"Fat (g)":0, "Carbohydrate (g)":0, "Protein (g)":0}) {
            if (ratio < 0.9) { fillColor = medColor; }
            else if (0.9 <= ratio && ratio < 1.1) { fillColor = goodColor; }
            else { fillColor = badColor; }
        } else if (d.data.name == "Fiber (g)") {
            if (ratio < 0.8) { fillColor = badColor; }
            else { fillColor = goodColor; }
        } else if (d.data.name == "Sugar (g)") {
            if (ratio < 1.0) { fillColor = medColor; }
            else { fillColor = badColor; }
        } else { // sodium
            if (ratio < 0.8) { fillColor = badColor; }
            else if (0.8 <= ratio && ratio < 1.2) { fillColor = goodColor; }
            else { fillColor = badColor; }
        }
        return fillColor;
    };

    vis.radScale = (r, rmax) => Math.max(Math.sqrt(vis.maxRad*vis.maxRad * (r / rmax)), 0.00001);

    // don't define outer radius yet
    vis.arc = d3.svg.arc()
        .innerRadius(0);

    vis.labelArc = d3.svg.arc()
        .outerRadius(vis.maxRad - 40)
        .innerRadius(vis.maxRad - 40);

    vis.pie = d3.layout.pie()
        .sort(null)
        .value(d => d.slice);

    // definitions for gradient fill
    vis.pieGrad = vis.svgPie.append("defs").attr("id", "pie-grad-def");

    vis.barScale = d3.scale.linear()
        .range([0, vis.width * 0.75]);

    vis.barHeight = 30;
    vis.barColor = "rgb(45, 142, 149)";

    vis.barGrad = vis.svgBar.append("defs");

    vis.selectedNutrient = "Calories";

    vis.stackTitle = vis.svgBar.append("text")
        .attr("id", "stack-title");

    // load data for recommended calories
    vis.driCalories = {
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
    d3.csv("data_raw/dri_calories.csv", function(data) {
        // transform in to object indexed by gender, age, activity
        data.forEach(function(d) {
            vis.driCalories[d.Gender]["Active"][d["Age (years)"]] = +d["Active"];
            vis.driCalories[d.Gender]["Moderately Active"][d["Age (years)"]] = +d["Moderately Active"];
            vis.driCalories[d.Gender]["Sedentary"][d["Age (years)"]] = +d["Sedentary"];
        });

        vis.wrangleMenuData();
    });
};

// TODO we don't really need this
MealPlanner.prototype.nutritionAnalysis = function(recipe) {
    const app_id = "11d4d52e";
    const app_key = "2d7e359cd72a42a1da103d23be96280d";

    // var proxyUrl = "http://localhost:5000/n";
    // const git = "https://flaskwebproject120161124101015.scm.azurewebsites.net:443/flaskwebproject120161124101015.git";
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
};

MealPlanner.prototype.recipeSearch = function(query) {
    let vis = this;

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
        vis.displayRecipes(JSON.parse(data));
    });
};

MealPlanner.prototype.displayRecipes = function(data) {
    let vis = this;

    let resultsHTML = "";

    if (data.hits.length <= 0) {
        resultsHTML = "<h4 class='text-center'>No Results</h4>";
    } else {
        // TODO if no results returned, display message
        const numDisplay = vis.queryLimit;
        vis.currRecipes = data.hits.slice(0, numDisplay).map(d => d.recipe);
        vis.currRecipes.forEach(function(recipe, i) {
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
                <button class="btn btn-primary add-recipe-button pull-right" type="button" id="recipe-add-button-${i}" onclick="mealPlanner.addRecipe(${i})">Add</button>
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
};

MealPlanner.prototype.addRecipe = function(selectIdx) {
    let vis = this;

    if (Object.keys(vis.selectRecipes).length >= vis.menuLimit) {
        console.log("over limit");
        return false;
    }
    const recipe = vis.currRecipes[selectIdx];
    const currIdx = vis.recipeCount;
    vis.selectRecipes[currIdx] = recipe;

    const newMenuItem =
    `<div class="panel-heading">
        <div class="row">
            <div class="col-md-11 panel-title-col">
                <h4 class="panel-title">
                    <a data-toggle="collapse" data-parent="#accordion-menu" href="#collapse${currIdx}">${recipe.label}</a>
                </h4>
            </div>
            <div class="col-md-1 panel-x">
                <span class="clickable glyphicon glyphicon-remove-circle xbutton" onclick="mealPlanner.removeRecipe(${currIdx})"></span>
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
    `<div class="panel-heading static-menu-header" id="static-menu-color-${currIdx}">
        <div class="row parent">
            <div class="col-md-11 panel-title-col">
                <h4 class="panel-title clickable" onclick="mealPlanner.pieHighlight(${currIdx})">
                    ${recipe.label}
                </h4>
            </div>
            <div class="col-md-1 panel-x">
                <span class="clickable glyphicon glyphicon-remove-circle xbutton" onclick="mealPlanner.removeRecipe(${currIdx})"></span>
            </div>
        </div>
     </div>`;

    $("#accordion-menu").append(`<div class="panel panel-default" id="menu-panel-${currIdx}">${newMenuItem}</div>`);
    // TODO this is super bad, but just do it for now
    $("#static-menu").append(`<div class="panel panel-default" id="static-menu-panel-${currIdx}">${staticMenuItem}</div>`);

    vis.recipeCount += 1;

    // control visualize button
    if (Object.keys(vis.selectRecipes).length > 0) {
        $('#vis-button').show();
    }

    vis.wrangleMenuData();
};

MealPlanner.prototype.removeRecipe = function(idx) {
    let vis = this;

    // remove from stored recipes
    delete vis.selectRecipes[idx];
    // remove from DOM
    $(`#menu-panel-${idx}`).remove();
    $(`#static-menu-panel-${idx}`).remove();

    // control visualize button
    if (Object.keys(vis.selectRecipes).length <= 0) {
        $('#vis-button').hide();
    }

    vis.wrangleMenuData();
};

MealPlanner.prototype.flipVis = function() {
    let vis = this;

    $("#recipe-block").toggle();
    $("#menu-vis-block").toggle();
    vis.wrangleMenuData();
};

MealPlanner.prototype.pieHighlight = function(idx) {
    let vis = this;

    if (vis.detailIndex.has(idx)) {
        $(`#static-menu-panel-${idx}`).removeClass("highlighted");
        vis.detailIndex.delete(idx);
    } else {
        $(`#static-menu-panel-${idx}`).addClass("highlighted");
        vis.detailIndex.add(idx);
    }

    vis.wrangleMenuData();
};

MealPlanner.prototype.wrangleMenuData = function() {
    let vis = this;

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
    let selectIntake = $.extend(true, {}, totIntake);
    for (let key in vis.selectRecipes) {
        if (vis.selectRecipes.hasOwnProperty(key)) {
            const recipe = vis.selectRecipes[key];
            const totNuts = recipe.totalNutrients;
            // TODO only assuming one serving here
            const servings = recipe.yield;
            let itemNut = {
                "name": vis.selectRecipes[key].label,
                "key": key,
                "values": []
            };
            for (let code in nutrientCodes) {
                if (totNuts.hasOwnProperty(code)) {
                    const perServNutrient = totNuts[code]["quantity"] / servings;
                    totIntake[nutrientCodes[code]] += perServNutrient;
                    itemNut.values.push({"x": nutrientCodes[code], "y": perServNutrient});
                    if (vis.detailIndex.has(parseInt(key))) {
                        selectIntake[nutrientCodes[code]] += perServNutrient;
                    }
                } else {
                    itemNut.values.push({"x": nutrientCodes[code], "y": 0});
                }
            }
            itemNutrients.push(itemNut);
        }
    }

    // aggregate nutrient info for selected items

    const recCal = vis.driCalories[gender][lifestyle][age];
    const totCal = totIntake["Calories"];
    const subCal = selectIntake["Calories"];

    let displayData = [];

    const indNuts = [
        "Fiber (g)",
        "Sodium (mg/d)"
    ];
    const depNuts = [
        "Fat (g)",
        "Carbohydrate (g)",
        "Protein (g)",
        "Sugar (g)"
    ];
    // calculate macro limits based on recommended calorie consumption
    const depNutsFactor = {
        "Fat (g)": 0.25 / 9,
        "Carbohydrate (g)": 0.45 / 4,
        "Protein (g)": 0.3 / 4,
        "Sugar (g)": 0.20 / 4 // PERCENTAGE HERE IS TOTALLY ARBITRARY. SHOULD BE ADJUSTABLE
    };

    // arrange stacked bar layout
    let stack = d3.layout.stack()
        .offset("zero")
        .values(d => d.values);

    let stacked = stack(itemNutrients);
    let reshapeStack = {
        "Calories": [],
        "Fat (g)": [],
        "Sodium (mg/d)": [],
        "Protein (g)": [],
        "Sugar (g)": [],
        "Carbohydrate (g)": [],
        "Fiber (g)": []
    };
    stacked.forEach(function(d) {
        d.values.forEach(function(v) {
            reshapeStack[v.x].push({
                "key": d.key,
                "name": d.name,
                "y": v.y,
                "y0": v.y0
            });
        });
    });


    d3.csv("data_raw/dri_detail.csv", function(error, driData) {
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
        vis.updateVis({
            "calData": [{
                "tot": totCal,
                "rec": recCal,
                "sub": subCal
            }],
            "nutData": displayData,
            "itemData": reshapeStack
        });
    });
};

MealPlanner.prototype.updateVis = function(data) {
    let vis = this;

    console.log(data);

    const calData = data.calData;
    const displayData = data.nutData;

    let groups = vis.svgPie.selectAll(".arc")
        .data(vis.pie(displayData));
    let g = groups.enter().append("g")
        .attr("class", "arc");
    groups.exit()
        .transition().duration(1000)
        .remove();
    // background, only draw once
    g.append("path")
        .attr("class", "background-arc")
        .attr("d", d => vis.arc.outerRadius(vis.maxRad)(d))
        .on("click", d => mealPlanner.selectNut(d.data.name));

    // TODO need this for overlay slices as well
    let pieGrads = vis.pieGrad.selectAll("radialGradient").data(vis.pie(displayData));
    let pieGradsEnter = pieGrads.enter().append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "100%")
        .attr("id", (d, i) => "grad" + i);
    pieGradsEnter.append("stop")
        .attr("class", "pie-grad-start-color")
        .attr("offset", "22%");
    pieGradsEnter.append("stop").attr("offset", "28%").style("stop-color", "white");
    // update gradient color start
    pieGrads.select(".pie-grad-start-color")
        .style("stop-color", d => vis.color(d));

    // draw new slice
    g.append("path")
        .attr("class", "foreground-arc");
    // update
    groups.select(".foreground-arc")
        // .attr("fill", d => color(d))
        .style("fill", (d, i) => "url(#grad" + i + ")")
        .transition()
        .duration(1000)
        .attr("d", d => vis.arc.outerRadius(vis.radScale(d.data.tot, d.data.limit))(d));

    // draw selected slices
    g.append("path")
        .attr("class", "overlay-arc");
    groups.select(".overlay-arc")
        .transition().duration(1000)
        .attr("d", d => vis.arc.outerRadius(vis.radScale(d.data.subset, d.data.limit))(d));

    // draw outline over everything else
    g.append("path")
        .attr("class", "outline-arc")
        .attr("d", d => vis.arc.outerRadius(vis.maxRad)(d));

    // labels, only draw once
    g.append("text")
        .attr("class", "pie-label pie-label-static")
        .attr("transform", d => "translate(" + vis.labelArc.centroid(d) + ")")
        .attr("dy", "-0.6em")
        .text(d => d.data.name);
    g.append("text")
        .attr("class", "pie-label pie-label-dynamic")
        .attr("transform", d => "translate(" + vis.labelArc.centroid(d) + ")")
        .attr("dy", "0.6em");
    groups.select(".pie-label-dynamic")
        .text(d => `${Math.round(d.data.tot)}/${Math.round(d.data.limit)}`);

    //////// draw calories bar
    vis.barScale.domain([0, calData[0]["rec"]]);

    let bars = vis.svgBar.selectAll(".bars")
        .data(calData);
    let bargroup = bars.enter().append("g")
        .attr("class", "bars");

    // vis.barX = d => (vis.width - vis.barScale(d.rec)) / 2;
    vis.barX = d => (vis.width - vis.barScale(d.rec)) / 2;
    vis.barY = vis.margin.top/2 - vis.barHeight/2;

    // background, only draw once
    bargroup.append("rect")
        .attr("class", "background-bar")
        // TODO refactor these x, y
        .attr("x", vis.barX)
        .attr("y", vis.barY)
        .attr("width", d => vis.barScale(d.rec))
        .attr("height", vis.barHeight)
        .attr("fill", "Lightgray")
        .on("click", d => mealPlanner.selectNut("Calories"));

    let barGrads = vis.barGrad.selectAll("linearGradient").data(calData)
        .enter().append("linearGradient")
        .attr("id", "bar-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
    barGrads.append("stop").attr("offset", "87%").style("stop-color", vis.barColor);
    barGrads.append("stop").attr("offset", "94%").style("stop-color", "White");

    // foreground
    bargroup.append("rect")
        .attr("class", "foreground-bar")
        .attr("x", vis.barX)
        .attr("y", vis.barY)
        .attr("height", vis.barHeight)
        .attr("fill", "url(#bar-gradient)");
    // update
    bars.select(".foreground-bar")
        .transition()
        .duration(1000)
        .attr("width", d => vis.barScale(d.tot));

    // draw overlay
    bargroup.append("rect")
        .attr("class", "overlay-bar")
        .attr("x", vis.barX)
        .attr("y", vis.barY)
        .attr("height", vis.barHeight);
    // update
    bars.select(".overlay-bar")
        .transition()
        .duration(1000)
        .attr("width", d => vis.barScale(d.sub));

    // draw boundaries
    bargroup.append("rect")
        .attr("class", "outline-rect")
        .attr("x", vis.barX)
        .attr("y", vis.barY)
        .attr("width", d => vis.barScale(d.rec))
        .attr("height", vis.barHeight)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 1)
        // .attr("stroke-dasharray", "10, 5")
        .attr("stroke", "Gray");

    // labels, only draw once
    bargroup.append("text")
        .attr("class", "calorie-label calorie-label-static")
        .attr("x", d => vis.barX(d) + 5)
        .attr("y", vis.margin.top/2)
        .attr("dy", "-0.2em")
        .text("Calories");
    bargroup.append("text")
        .attr("class", "calorie-label calorie-label-dynamic")
        .attr("x", d => vis.barX(d) + 5)
        .attr("y", vis.margin.top/2)
        .attr("dy", "1.0em");
    bars.select(".calorie-label-dynamic")
        .text(d => `${Math.round(d.tot)}/${Math.round(d.rec)}`);

    /////////// extra vis
    console.log(data.itemData[vis.selectedNutrient]);

    vis.stackX = 490;
    vis.stackY0 = vis.pieCenterY - vis.maxRad;
    vis.stackWidth = 50;

    vis.stackScale = d3.scale.linear()
        .domain([0, data.itemData[vis.selectedNutrient].reduce((a, b) => a + b.y, 0)])
        .range([0, vis.maxRad*2]);

    // vis.stackColor = d3.scale.category20()
    //     .domain(data.itemData[vis.selectedNutrient].map(e => e.key));

    vis.stackColor = d3.scale.linear().domain([0, data.itemData[vis.selectedNutrient].length])
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#3182bd"), d3.rgb('#FFFFFF')]);

    let detailBars = vis.svgBar.selectAll("g.layer")
        .data(data.itemData[vis.selectedNutrient], d => d.key);
    let detailBarGroup = detailBars.enter().append("g")
        .attr("class", "layer")
        .attr("opacity", 1)
        .attr("transform", "translate(" + vis.stackX + "," + vis.stackY0 + ")");
    detailBarGroup.append("rect")
        .attr("class", "stack")
        .attr("x", 0)
        .attr("width", vis.stackWidth);
    detailBars.select(".stack")
        .transition().duration(1000)
        .attr("y", d => vis.stackScale(d.y0))
        .attr("height", d => vis.stackScale(d.y))
        .attr("fill", (d, i) => vis.colorMenu(d.key, i));

    detailBarGroup.append("text")
        .attr("class", "stack-label")
        .attr("x", vis.stackWidth + 5)
        .attr("width", 50);
    detailBars.select(".stack-label")
        .text(d => clipText(d.name))
        .transition().duration(1000)
        .attr("y", d => vis.stackScale(d.y0) + vis.stackScale(d.y)/2);

    detailBars.exit()
        // TODO can't get transition to work properly
        .transition().duration(1000)
        .attr("opacity", 0)
        .remove();

    vis.stackTitle
        .attr("x", vis.stackX)
        .attr("y", vis.stackY0 - 10)
        .text("Breakdown of " + cleanText(vis.selectedNutrient));
};

MealPlanner.prototype.colorMenu = function(key, idx) {
    let vis = this;

    const color = vis.stackColor(idx);

    // color menu accordion
    $(`#static-menu-panel-${key}`).css({
        "border-left": "4px solid " + color
    });

    return color;
};

MealPlanner.prototype.selectNut = function(name) {
    let vis = this;

    vis.selectedNutrient = name;

    vis.wrangleMenuData();
};

function clipText(text) {
    const limit = 25;
    let clip = text.substring(0, limit);
    if (text.length > limit) {
        clip += "...";
    }
    return clip
}

function cleanText(text) {
    let cleanText = text;
    let breakIdx = text.indexOf(' ');
    if (breakIdx != -1) {
        cleanText = text.substring(0, breakIdx);
    }
    return cleanText;
}