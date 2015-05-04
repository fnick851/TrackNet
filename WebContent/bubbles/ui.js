d3.json("../data/851.adjacency.json", function(error, data) {
    completeData = data;
    init("#tabs", "domain", false);
    
    $("#status-domain").hide();
    $("#status-category").hide();
    
    $("#tabs").tabs({
        activate: function(event, ui) {
            if (ui.newTab.context.innerText == "Website") {
                viewType = "domain";
                if (domainId >= 0) {
                    loadData(domainId);
                    drawGraph();
                } else {
                    refreshTimeline();
                }
                
            } else if (ui.newTab.context.innerText == "Category") {
                viewType = "category";
                if (categoryId >= 0) {
                    loadData(categoryId);
                    drawGraph();
                } else {
                    refreshTimeline();
                }
            }
        }
    });
    
    var domains = [];
    for (var id in completeData.firstPartyDomains) {
        domains.push({ "label": completeData.domainList[id], "id": id });
    }
    $("#search-domain").autocomplete({
        source: domains,
        select: function(event, ui) {
            $("#status-domain").show();
            $("#callout-domain").hide();
            if (domainId >= 0)
                domainUndoList.push(domainId);
            domainId = ui.item.id;
            domainRedoList = [];
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
            $("#status-category").show();
            $("#callout-category").hide();
            if (categoryId >= 0)
                categoryUndoList.push(categoryId);
            categoryId = ui.item.id;
            categoryRedoList = [];
            loadData(categoryId);
            drawGraph();
        }
    });
    
//    svg.append("rect")
//       .attr("width", svgDimentions[0])
//       .attr("height", svgDimentions[1])
//       .attr("stroke", "black")
//       .attr("fill", "none");
});