const testRecipe =
    {
        "title": "Fresh Ham Roasted With Rye Bread and Dried Fruit Stuffing",
        "prep": "1. Have your butcher bone and butterfly the ham and score the fat in a diamond pattern. ...",
        "yield": "About 15 servings",
        "ingr": [
            "1 fresh ham, about 18 pounds, prepared by your butcher (See Step 1)",
            "7 cloves garlic, minced",
            "1 tablespoon caraway seeds, crushed",
            "4 teaspoons salt",
            "Freshly ground pepper to taste",
            "1 teaspoon olive oil",
            "1 medium onion, peeled and chopped",
            "3 cups sourdough rye bread, cut into 1/2-inch cubes",
            "1 1/4 cups coarsely chopped pitted prunes",
            "1 1/4 cups coarsely chopped dried apricots",
            "1 large tart apple, peeled, cored and cut into 1/2-inch cubes",
            "2 teaspoons chopped fresh rosemary",
            "1 egg, lightly beaten",
            "1 cup chicken broth, homemade or low-sodium canned"
        ]
    };

let currRecipes = [];

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
    currRecipes = data.hits.slice(0, numDisplay);
    currRecipes.forEach(function(d, i) {
        const recipe = d.recipe;

        resultsHTML +=
        `<div class="col-md-4">
            <div class="thumbnail">
                <a href="${recipe.url}" target="_blank"><img src="${recipe.image}" alt="${recipe.label}"></a>
                <div class="caption">
                    <h5 class="recipe-title">${recipe.label}</h5>
                    <p>Calories per serving: ${Math.floor(recipe.calories / recipe.yield)}</p>
                    <p><button class="btn btn-primary add-recipe-button" type="button" id="recipe-button-${i}" onclick="addRecipe(${i})">Add to menu</button></p>
                </div>
            </div>
        </div>`;
    });

    // TODO allow users to search for more recipes with same query?

    $("#recipe-results").append("<div class='row'>" + resultsHTML + "</div>");
}

function addRecipe(idx) {
    console.log(idx);
}