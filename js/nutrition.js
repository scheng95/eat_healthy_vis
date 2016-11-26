var testRecipe =
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

$(function() {
    console.log("Ready");
    recipeSearch("chicken");
});

function nutritionAnalysis(recipe) {
    var app_id = "11d4d52e";
    var app_key = "2d7e359cd72a42a1da103d23be96280d";

    // var proxyUrl = "http://localhost:5000/n";
    var git = "https://flaskwebproject120161124101015.scm.azurewebsites.net:443/flaskwebproject120161124101015.git";
    var baseUrl = "http://flaskwebproject120161124101015.azurewebsites.net/n";

    var payload = {
        "app_id": app_id,
        "app_key": app_key,
        "recipe": JSON.stringify(recipe)
    };

    $.post(proxyUrl, payload, function(data, status) {
        console.log(data);
        console.log(status);
    });
}

function recipeSearch(query) {
    var app_id = "58b4a2d1";
    var app_key = "6632220a737740e2eeb51be026a62788";

    // var baseUrl = "http://edamamproxy.azurewebsites.net/r";
    var baseUrl = "http://flaskwebproject120161124101015.azurewebsites.net/r";
    // var baseUrl = "http://localhost:5000/r";

    var proxyUrl = baseUrl + `?q=${query}&app_id=${app_id}&app_key=${app_key}`;

    $.get(proxyUrl, function(data, status) {
        console.log(data);
        console.log(status);
    });
}