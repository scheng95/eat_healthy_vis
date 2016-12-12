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

// nutrition primer pie
$(function() {
    let dummyData = [
        {"name": "Fat (g)", "val": 1},
        {"name": "Sodium (mg/d)", "val": 1},
        {"name": "Protein (g)", "val": 1},
        {"name": "Sugar (g)", "val": 1},
        {"name": "Carbohydrate (g)", "val": 1},
        {"name": "Fiber (g)", "val": 1}
    ];

    // TODO add margin
    let width = 300;
    let height = 300;
    let radius = width / 2;

    let svg = d3.select("#basic-vis").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    let pie = d3.layout.pie()
        .sort(null)
        .value(d => d.val);

    let arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(radius);

    let labelArc = d3.svg.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    svg.selectAll(".arc")
        .data(pie(dummyData))
        .enter().append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", "Lightgrey");
    svg.selectAll(".pie-label")
        .data(pie(dummyData))
        .enter().append("text")
        .attr("class", "pie-label")
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .text(d => d.data.name)
        .attr("fill", "black");

});
