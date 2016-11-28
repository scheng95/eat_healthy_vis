// prevent form submission using enter button (script makes it reactive to changes)
// from http://stackoverflow.com/questions/895171/prevent-users-from-submitting-form-by-hitting-enter
$(document).ready(function() {
    $(window).keydown(function(event){
        if(event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });
});

$(function() {
    // control for "about me" input
    (function() {
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
                updateVis();
            }
        });
        $('#dropdown-gender').on('input', function() {
            if (!$("#input-age-group").hasClass("has-error")) {
                updateVis();
            }
        });
        $('#dropdown-lifestyle').on('input', function() {
            if (!$("#input-age-group").hasClass("has-error")) {
                updateVis();
            }
        });
    })();

    // search recipe API and display results
    $("#recipe-search-button").click(function() {
        console.log("searching");
        const query = $("#input-recipe-search").val();
        recipeSearch(query);
    });
});
