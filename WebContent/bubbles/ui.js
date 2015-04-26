domainId = 1004;
categoryId = 19;
d3.json("data/851.adjacency.json", function(error, data) {
    completeData = data;
    
    $("#tabs").tabs({
        activate: function(event, ui) {
            if (ui.newTab.context.innerText == "Website") {
                viewType = "domain";
                loadData(domainId);
            } else if (ui.newTab.context.innerText == "Category") {
                viewType = "category";
                loadData(categoryId);
            }
            drawGraph();
        }
    });
    
    var domains = [];
    for (var id in completeData.firstPartyDomains) {
        domains.push({ "label": completeData.domainList[id], "id": id });
    }
    $("#search-domain").autocomplete({
        source: domains,
        select: function(event, ui) {
            domainId = ui.item.id;
            loadData(domainId);
            drawGraph();
        }
    });
    
    var categories = [];
    for (var id in completeData.firstPartyCategories) {
        categories.push({ "label": completeData.catList[id], "id": id });
    }
    $("#search-category").autocomplete({
        source: categories,
        select: function(event, ui) {
            categoryId = ui.item.id;
            loadData(categoryId);
            drawGraph();
        }
    });

    svg = d3.select("#tabs")
            .append("svg")
            .attr("width", 1500)
            .attr("height", 550);
    viewType = "domain";
    loadData(domainId);
    drawGraph();
    svg.append("rect")
       .attr("width", 5)
       .attr("height", 5);
    svg.append("rect")
       .attr("y", 545)
       .attr("width", 5)
       .attr("height", 5);
});