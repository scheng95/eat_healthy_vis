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
        {"name": "Fat (g)", "val": 1, "color": 0},
        {"name": "Carbohydrate (g)", "val": 1, "color": 0},
        {"name": "Protein (g)", "val": 1, "color": 0},
        {"name": "Sugar (g)", "val": 1, "color": 2},
        {"name": "Sodium (mg/d)", "val": 1, "color": 2},
        {"name": "Fiber (g)", "val": 1, "color": 1}
    ];

    // TODO add margin
    let margin = {top: 10, right: 10, bottom: 10, left: 10};
    let width = 350 - margin.left - margin.right;
    let height = 350 - margin.top - margin.bottom;
    let radius = width / 2;

    let svg = d3.select("#basic-vis").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");

    let pie = d3.layout.pie()
        .sort(null)
        .value(d => d.val);

    let arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(radius);

    let labelArc = d3.svg.arc()
        .outerRadius(radius - 50)
        .innerRadius(radius - 50);

    let colors = colorbrewer.Blues[6];

    svg.selectAll(".arc")
        .data(pie(dummyData))
        .enter().append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", d => colors[d.data.color])
        .attr("stroke", "Gray");
    svg.selectAll(".pie-label")
        .data(pie(dummyData))
        .enter().append("text")
        .attr("class", "pie-label")
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .text(d => d.data.name)
        .attr("fill", "black");

});
