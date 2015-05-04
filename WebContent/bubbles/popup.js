d3.json("../data/851.adjacency.json", function(error, data) {
    completeData = data;

    bubbleCenter = [245,245];
    
    boxTopLeft = [540,bubbleCenter[1]-bigRadius-2*bubbleSizeRange[0]];
    boxDimentions = [250,480,480];
    trackerItemTopLeft = [boxTopLeft[0]+boxDimentions[0]*0.05,boxTopLeft[1]+70];
    
    p1ListTopLeft = [830,boxTopLeft[1]];
    p1ListItemDimentions = [190,trackerItemHeight];
    
    svgDimentions = [p1ListTopLeft[0]+p1ListItemDimentions[0]+(boxDimentions[2]-boxDimentions[0]),490];
    nextScreenX = svgDimentions[0]-(bubbleCenter[0]+centralBubbleRadius);
    
    if (document.cookie.length == 0) {
        var skipedCatIdDict = {};
        for (var cid in completeData.catList) {
            skipedCatIdDict[cid] = false;
        }
        Cookies.set("skipedCategoryIdDict", skipedCatIdDict);
    }
    
    var pv = getUrlVars();
    if ("domain" in pv) {
        $("#status font").attr("id", "current-domain");
        init("#bubblesView", "domain", true);
        if (domainId >= 0)
            domainUndoList.push(domainId);
        domainId = pv.domain;
        domainRedoList = [];
        loadData(domainId);
        drawGraph();
    } else if ("category" in pv) {
        $("#status font").attr("id", "current-category");
        init("#bubblesView", "category", true);
        if (categoryId >= 0)
            categoryUndoList.push(categoryId);
        categoryId = pv.category;
        categoryRedoList = [];
        loadData(categoryId);
        drawGraph();
    }
    
    svg.append("text")
       .attr("id", "resetBubbles")
       .attr("y", svgDimentions[1]-2)
       .attr("font-size", 10)
       .style("pointer-events", "all")
       .text("[Reset Bubbles]")
       .on("click", function() {
           for (var cid in completeData.catList) {
               skipedCategoryIdDict[cid] = false;
           }
           Cookies.set("skipedCategoryIdDict", skipedCategoryIdDict);
           loadData("domain" in pv ? domainId : categoryId);
           drawGraph();
       });
    
//    svg.append("rect")
//       .attr("width", svgDimentions[0])
//       .attr("height", svgDimentions[1])
//       .attr("stroke", "black")
//       .attr("fill", "none");
});

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}