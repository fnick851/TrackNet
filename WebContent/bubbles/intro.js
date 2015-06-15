var tooltip;
var intro_step = 0;
d3.json("../data/851.adjacency.json", function(error, data) {
    completeData = data;
    init("#tabs", "domain", false);
    
    intro_step = 0;
    tooltip = $("#search-domain").qtip({
        content: {
        	title: 'Instruction: Search',
            text: '<ul>\
     	               <li>You can search a website here.</li>\
            	       <br>==> Input \"yahoo.com\".\
            	   </ul>'
        },
        position: {
            my: 'left top',
            at: 'right center'
        },
        style: {
        	classes: 'tooltip'
        },
        show: {
            when: false, // Don't specify a show event
            ready: true // Show the tooltip when ready
        },
        hide: false // Don't specify a hide event
    });
    
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
            if (domainId >= 0)
                domainUndoList.push(domainId);
            domainId = ui.item.id;
            domainRedoList = [];
            loadData(domainId);
            drawGraph();
            tooltip.qtip('destroy');
            intro_step = 1;
            tooltip = $("#bubbleWheel").qtip({
                content: {
                	title: 'Instruction: Bubbles',
                    text: '<ul>\
                    	       <li>The central gray bubble is the website you want to explore.</li>\
                    	​       <li>The surrounding bubbles represent the type of trackers.\
                    	           The size of a bubble measures how many trackers of that type\
                    	           (#shown on the bubbles).​</li>\
                    	       <br>==> Mouse over the blue bubble to see detailed information.​\
                    	   </ul>'
                },
                position: {
                    my: 'left center',
                    at: 'right center'
                },
                style: {
                	classes: 'tooltip'
                },
                show: {
                    when: false, // Don't specify a show event
                    ready: true // Show the tooltip when ready
                },
                hide: false // Don't specify a hide event
            });
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