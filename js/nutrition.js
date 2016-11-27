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
    console.log(data);
    globe = data;
    let resultsHTML = "";

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

    // TODO allow users to search for more recipes with same query?

    $("#recipe-results").append("<div class='row'>" + resultsHTML + "</div>");
}

function addRecipe(selectIdx) {
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

    updateVis();
}

function removeRecipe(idx) {
    // remove from stored recipes
    delete selectRecipes[idx];
    // remove rom DOM
    $(`#menu-panel-${idx}`).remove();

    updateVis();
}