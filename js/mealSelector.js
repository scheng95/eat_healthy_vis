let mealPlanner;

$(function() {
    // initialize vis object, should only use one at a time
    mealPlanner = new MealPlanner();

    // control for "about me" input
    // TODO add note about valid range of ages
    const minAge = 2;
    const maxAge = 76;

    // show error if user inputs age outside range
    $('#input-age').on('input', function() {
        // form validation
        const setVal = $(this).val();
        // TODO for some reason, isInteger is not working here...
        // if ((setVal > maxAge) || (setVal < minAge) || !(Number.isInteger(setVal))) {
        if ((setVal > maxAge) || (setVal < minAge)) {
            $("#input-age-group").addClass("has-error");
        } else {
            $("#input-age-group").removeClass("has-error");
            mealPlanner.wrangleMenuData();
        }})
        // prevent enter form submit on age
        .keypress(function(event) {
            if (event.which == 13) {
                event.preventDefault();
                return false;
            }
        });
    $('#dropdown-gender').on('input', function() {
        if (!$("#input-age-group").hasClass("has-error")) {
            mealPlanner.wrangleMenuData();
        }
    });
    $('#dropdown-lifestyle').on('input', function() {
        if (!$("#input-age-group").hasClass("has-error")) {
            mealPlanner.wrangleMenuData();
        }
    });

    // search recipe API and display results
    $("#recipe-search-button").click(function() {
        console.log("searching");
        const query = $("#input-recipe-search").val();
        mealPlanner.recipeSearch(query);
    });
    // user can also submit query with enter key
    $("#input-recipe-search").keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            console.log("searching");
            const query = $("#input-recipe-search").val();
            mealPlanner.recipeSearch(query);
        }
    });
});
