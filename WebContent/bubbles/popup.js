d3.json("data/851.adjacency.json", function(error, data) {
    completeData = data;
    
    var pv = getUrlVars();
    if ("domain" in pv) {
        $("#status font").attr("id", "current-domain");
        init("#bubblesView", "domain");
        if (domainId >= 0)
            domainUndoList.push(domainId);
        domainId = pv.domain;
        domainRedoList = [];
        loadData(domainId);
        drawGraph();
    } else if ("category" in pv) {
        $("#status font").attr("id", "current-category");
        init("#bubblesView", "category");
        if (categoryId >= 0)
            categoryUndoList.push(categoryId);
        categoryId = pv.category;
        categoryRedoList = [];
        loadData(categoryId);
        drawGraph();
    }
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