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
    console.log("Ready")
});

function nutritionAnalysis(recipe) {
    var app_id = "11d4d52e";
    var app_key = "2d7e359cd72a42a1da103d23be96280d";
    var baseUrl = "https://api.edamam.com/api/nutrition-details";

    var proxyUrl = `http://localhost:5000/proxy/${baseUrl}`;
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