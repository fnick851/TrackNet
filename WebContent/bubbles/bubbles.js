var svg;
var colors = d3.scale.category10();
var viewType;

var completeData;
var domainId;
var categoryId;

var useCookie;
var skipedCategoryIdDict = {};

var domainUndoList = [];
var domainRedoList = [];
var categoryUndoList = [];
var categoryRedoList = [];

var p1Info;
var bubbleData;
var bubbleCenter = [260,260];
var centralBubbleRadius = 35;
var bigRadius = 120;
var smallRadius = 65;
var bubbleSizeRange = [60, 20];
var bubbleVisibleCapacity = 15;
var shrinkRadius = 16;
var rightMostAngle = 0;

var boxTopLeft = [550,bubbleCenter[1]-bigRadius-2*bubbleSizeRange[0]];
var boxDimentions = [250,490,500];
var trackerItemTopLeft = [boxTopLeft[0]+boxDimentions[0]*0.05,boxTopLeft[1]+70];
var boxVisibleCapacity = 18;
var trackerItemHeight = 22;
var showingTreemap = false;

var p1ListTopLeft = [850,boxTopLeft[1]];
var p1ListItemDimentions = [190,trackerItemHeight];
var p1ListVisibleCapacity = boxVisibleCapacity;

var nextScreenX = p1ListTopLeft[0]+p1ListItemDimentions[0];
var svgDimentions = [nextScreenX+bubbleCenter[0]+centralBubbleRadius,520];

function init(selector, vtype, uc) {
    svg = d3.select(selector)
            .append("svg")
            .attr("width", svgDimentions[0])
            .attr("height", svgDimentions[1]);
    viewType = vtype;
    drawTimeline();
    useCookie = uc;
    if (useCookie) {
        skipedCategoryIdDict = Cookies.getJSON("skipedCategoryIdDict");
    } else {
        for (var cid in completeData.catList) {
            skipedCategoryIdDict[cid] = false;
        }
    }
}

function setSkipedCategoryIdDict(id, isSkiped) {
    skipedCategoryIdDict[id] = isSkiped;
    if (useCookie) {
        Cookies.set("skipedCategoryIdDict", skipedCategoryIdDict);
    }
}

function drawTimeline() {
    var timeline = svg.append("g")
                      .attr("id", "timeline");
    
    var undo = drawTriangle("#timeline", [10,0], "left", "black", "inactive");
    undo.on("click", function() {
            if (undo.attr("status") == "active") {
                if (viewType == "domain") {
                    domainRedoList.push(domainId);
                    domainId = domainUndoList.pop();
                    loadData(domainId);
                } else {
                    categoryRedoList.push(categoryId);
                    categoryId = categoryUndoList.pop();
                    loadData(categoryId);
                }
                svg.select("#canvas")
                   .transition()
                   .duration(1000)
                   .attr("transform", function() {
                       return d3.svg.transform().translate([nextScreenX,0])();
                   })
                   .each("end", function() {
                       drawGraph();
                   });
            }
        })
        .append("title")
        .text("Show the previous view.");
    timeline.append("text")
            .attr("id", "undo")
            .attr("x", 25)
            .attr("y", 14)
            .style("text-anchor", "start");
    
    var redo = drawTriangle("#timeline", [nextScreenX+bubbleCenter[0],0], "right", "black", "inactive");
    redo.on("click", function() {
            if (redo.attr("status") == "active") {
                if (viewType == "domain") {
                    domainUndoList.push(domainId);
                    domainId = domainRedoList.pop();
                    loadData(domainId);
                } else {
                    categoryUndoList.push(categoryId);
                    categoryId = categoryRedoList.pop();
                    loadData(categoryId);
                }
                svg.select("#canvas")
                   .transition()
                   .duration(1000)
                   .attr("transform", function() {
                       return d3.svg.transform().translate([-nextScreenX,0])();
                   })
                   .each("end", function() {
                       drawGraph();
                   });
            }
        })
        .append("title")
        .text("Show the next view.");
    timeline.append("text")
            .attr("id", "redo")
            .attr("x", nextScreenX+bubbleCenter[0]-15)
            .attr("y", 14)
            .style("text-anchor", "end");
}

function loadData(id) {
    switch (viewType) {
    case "domain":
        domainId = id;
        p1Info = completeData.firstPartyDomains[domainId];
        break;
    case "category":
        categoryId = id;
        p1Info = completeData.firstPartyCategories[categoryId];
        break;
    }
    bubbleData = [];
    rightMostAngle = 0;
    for (var i = 0; i < p1Info.catList.length; i++) {
        bubbleData.push({ "index": i,
                          "id": p1Info.catList[i],
                          "category": completeData.catList[p1Info.catList[i]],
                          "size": p1Info[p1Info.catList[i]].length,
                          "shrink": skipedCategoryIdDict[p1Info.catList[i]]});
    }
}

function computeBubblePositions() {
    var bigBubbleIdx = [-1,-1];
    var smallBubbleIdx = [-1,-1];
    var sizeRange = [-1,-1];
    var numberOfBigBubbles = 0;
    for (var i = 0; i < bubbleData.length; i++) {
        if (bubbleData[i].shrink != true) {
            if (sizeRange[0] < 0) {
                sizeRange[0] = bubbleData[i].size;
            }
            sizeRange[1] = bubbleData[i].size;
            numberOfBigBubbles++;
        }
    }
    var minScale;
    if (numberOfBigBubbles > bubbleVisibleCapacity) {
        minScale = bubbleSizeRange[1];
    } else {
        var scale = d3.scale.linear()
                      .domain([1,bubbleVisibleCapacity])
                      .range(bubbleSizeRange);
        minScale = scale(numberOfBigBubbles);
    }
    var bubbleScale = d3.scale.sqrt()
                        .domain(sizeRange)
                        .range([bubbleSizeRange[0],minScale]);
    for (var i = 0; i < bubbleData.length; i++) {
        if (bubbleData[i].shrink != true) {
            bubbleData[i].R = bigRadius;
            bubbleData[i].r = bubbleScale(bubbleData[i].size);
            bigBubbleIdx = computeAngle(i, bigBubbleIdx[0], bigBubbleIdx[1]);
        } else {
            bubbleData[i].R = smallRadius;
            bubbleData[i].r = shrinkRadius;
            smallBubbleIdx = computeAngle(i, smallBubbleIdx[0], smallBubbleIdx[1]);
        }
        bubbleData[i].x = bubbleX(bubbleData[i]);
        bubbleData[i].y = bubbleY(bubbleData[i]);
    }
}

function computeAngle(i, preIdx, firstIdx) {
    if (firstIdx < 0) {
        bubbleData[i].angle = 0;
        return [i,i];
    } else {
        var angle = bubbleAngle(bubbleData[i].R, bubbleData[preIdx].r, bubbleData[i].r);
        var angleCC = bubbleAngle(bubbleData[i].R, bubbleData[firstIdx].r, bubbleData[i].r);
        if (angle + bubbleData[preIdx].angle <= 2 * Math.PI - angleCC) {
            bubbleData[i].angle = angle + bubbleData[preIdx].angle;
            preIdx = i;
        } else {
            bubbleData[i].angle = bubbleData[preIdx].angle;
        }
        return [preIdx,firstIdx];    
    }
}

function bubbleAngle(R, r1, r2) {
    var a = r1 + r1/10 + r2;
    var b = R + r1;
    var c = R + r2;
    return Math.acos((Math.pow(b,2)+Math.pow(c,2)-Math.pow(a,2))/(2*b*c));
}

function bubbleX(data) {
    return bubbleCenter[0] + (data.R + data.r) * Math.cos(data.angle-rightMostAngle);
}

function bubbleY(data) {
    return bubbleCenter[1] + (data.R + data.r) * Math.sin(data.angle-rightMostAngle);
}

function linkX(data) {
    return bubbleCenter[0] + data.R * Math.cos(data.angle-rightMostAngle);
}

function linkY(data) {
    return bubbleCenter[1] + data.R * Math.sin(data.angle-rightMostAngle);
}

function shrinkTransition(token, data) {
    token.select("line")
         .transition()
         .attr("x2", linkX(data))
         .attr("y2", linkY(data));
    token.selectAll("circle")
         .transition()
         .attr("cx", bubbleX(data))
         .attr("cy", bubbleY(data))
         .attr("r", data.r)
         .each("end", function() {
             reDrawBubbles();
         });
}

function reDrawBubbles() {
    computeBubblePositions();
    svg.selectAll(".catgoryBubble")
       .data(bubbleData);
    return drawBubbles();
}

function drawTriangle(selector, offset, orientation, color, status) {
    var dim = 20;
    var rotate;
    switch (orientation) {
    case "down":
        rotate = 0;
        break;
    case "up":
        rotate = 180;
        offset[0] += dim;
        offset[1] += dim;
        break;
    case "left":
        rotate = 90;
        offset[0] += dim;
        break;
    case "right":
        rotate = 270;
        offset[1] += dim;
        break;
    }
    offset[0] = offset[0]-dim/2;
    var transform = d3.svg.transform()
                      .translate(offset)
                      .rotate(rotate);
    return d3.select(selector)
             .append("polygon")
             .attr("class", "triangleButton")
             .attr("id", orientation)
             .attr("points", "0,0 "+dim+",0 "+dim/2+","+dim)
             .attr("fill", color)
             .attr("status", status)
             .attr("transform", transform)
             .on("mouseover", function() {
                 d3.select(this).attr("opacity", 0.2);
             })
             .on("mouseout", function() {
                 d3.select(this).attr("opacity", null);
             });
}

function drawCloseButton(x, y, r) {
    var rc = r/2;
    var closeButton = svg.select("#canvas")
                         .append("g")
                         .attr("id", "closeButton")
                         .style("pointer-events", "none");
    closeButton.append("circle")
               .attr("cx", x)
               .attr("cy", y)
               .attr("r", r)
               .attr("fill", "white")
               .attr("opacity", 0.7);
    closeButton.append("line")
               .attr("x1", x-rc)
               .attr("y1", y-rc)
               .attr("x2", x+rc)
               .attr("y2", y+rc)
               .attr("stroke", "black")
               .attr("stroke-width", rc/3);
    closeButton.append("line")
               .attr("x1", x+rc)
               .attr("y1", y-rc)
               .attr("x2", x-rc)
               .attr("y2", y+rc)
               .attr("stroke", "black")
               .attr("stroke-width", rc/3);
}

function resumeTrackersBox() {
    svg.select("#p1List").remove();
    svg.selectAll(".trackerButton[status=on] polygon")
       .attr("visibility", null);
    svg.selectAll(".trackerButton[status=on] rect")
       .attr("fill", "white");
    svg.selectAll(".trackerButton[status=on] text")
       .attr("font-weight", null);
    svg.selectAll(".trackerButton[status=on]")
       .attr("status", null);
    svg.selectAll(".trackerButton")
       .attr("visibility", null);
    svg.select("#trackersBox rect")
       .transition()
       .attr("width", boxDimentions[0])
       .attr("height", boxDimentions[1])
       .attr("rx", 30)
       .attr("ry", 30);
    svg.select("#trackersBox #down")
       .attr("status", "inactive");
    svg.select("#trackersBox #right")
       .attr("status", "active");
}

function drawTreemap(token) {
    var treemap = d3.layout.treemap()
                    .size([boxDimentions[2]-boxDimentions[0]*0.1, boxDimentions[1]-100])
                    .sort(function comparator(a, b) {
                        return a.value - b.value;
                    })
                    .value(function(d) {
                        return d.p1Length;
                    });
    treemap({"children":token.data()});
    token.select("g")
         .transition()
         .duration(1000)
         .attr("transform", function(d) {
             return d3.svg.transform()
                      .translate([trackerItemTopLeft[0]+d.x,trackerItemTopLeft[1]+d.y])();
         });
    token.select("g rect")
         .transition()
         .duration(1000)
         .attr("width", function(d) {
             return d.dx;
         })
         .attr("height", function(d) {
             return d.dy;
         })
         .attr("stroke-width", 2);
    token.selectAll("g text")
         .attr("visibility", function(d) {
             return d.p1Length > 0 ? null : "hidden";
         });
    token.select("g text.label")
         .attr("x", boxDimentions[0] * 0.02)
         .text(function(d) {
             return d.domain.substr(0, parseInt(d.dx*0.13));
         });
    token.select("g text.size")
         .attr("x", boxDimentions[0] * 0.02)
         .attr("y", 30)
         .style("text-anchor", null);
}

function drawTrackersBox(data) {
    var trackerButtons = drawTrackersList("trackersBox", data);
    
    var dim = trackerItemHeight * 0.5;
    trackerButtons.select("g")
                  .append("polygon")
                  .attr("points", "0,0 "+dim+",0 "+dim/2+","+dim)
                  .attr("fill", colors(data.index))
                  .attr("transform", function(d) {
                      return d3.svg.transform()
                               .translate([boxDimentions[0]*0.81,16])
                               .rotate(270)();
                  })
                  .style("pointer-events", "none")
                  .attr("opacity", 0.8)
                  .attr("visibility", function(d) {
                      return d.p1Length == 0 ? "hidden" : null;
                  });
    trackerButtons.on("mouseover", function(d) {
                       if (d3.select(this).attr("status") != "on") {
                           d3.select(this).select("rect")
                             .attr("fill", colors(data.index));
                           d3.select(this).select("text")
                             .attr("font-weight", "bold");
                           drawP1List(d);
                       }
                   })
                   .on("mouseout", function() {
                       if (d3.select(this).attr("status") != "on") {
                           d3.select(this).select("rect")
                             .attr("fill", "white");
                           d3.select(this).select("text")
                             .attr("font-weight", null);
                           svg.select("#p1List").remove();
                       }
                   })
                   .on("click", function(d) {
                       if (!showingTreemap && d.p1Length > 0
                           && d3.select(this).attr("status") != "on") {
                           d3.select(this).attr("status", "on");
                           svg.select("#p1List").remove();
                           svg.selectAll(".trackerButton:not([status=on])")
                              .attr("visibility", "hidden");
                           svg.select("#trackersBox #down")
                              .attr("status", "active");
                           svg.select("#trackersBox #right")
                              .attr("status", "inactive");
                           svg.select("#trackersBox rect")
                                 .transition()
                                 .attr("height", 65)
                                 .attr("rx", 20)
                                 .attr("ry", 20);
                           d3.select(this).selectAll("polygon")
                             .attr("visibility", "hidden");
                           drawP1Box(d);
                       } else if (d3.select(this).attr("status") == "on") {
                           resumeTrackersBox();
                       }
                   });
    
    var navOffset = 10;
    var triLeft = drawTriangle("#trackersBox", [boxTopLeft[0]+boxDimentions[0]*0.22,boxTopLeft[1]+navOffset], 
                               "left", colors(data.index), "active");
    triLeft.on("click", function() {
               removeRightPart();
           })
           .append("title")
           .text("Close the trackers' list.");
    var triDown = drawTriangle("#trackersBox", [boxTopLeft[0]+boxDimentions[0]*0.5,boxTopLeft[1]+navOffset], 
                               "down", colors(data.index), "inactive");
    triDown.on("click", function() {
               if (triDown.attr("status") == "active") {
                   resumeTrackersBox();
               }
           })
           .append("title")
           .text("Show the trackers' list.");
    var triRight = drawTriangle("#trackersBox", [boxTopLeft[0]+boxDimentions[0]*0.78,boxTopLeft[1]+navOffset],
                                "right", colors(data.index), "active");
    triRight.on("click", function() {
                if (triRight.attr("status") == "inactive")
                    return;
                trackerButtons.attr("class", "trackerButtonTreemap");
                svg.select("#trackersBox rect")
                   .transition()
                   .attr("width", boxDimentions[2]);
                svg.select("#trackersBox text")
                   .transition()
                   .attr("x", boxTopLeft[0]+boxDimentions[2]/2)
                svg.selectAll(".trackerButtonGroup polygon")
                   .attr("visibility", "hidden");
                triRight.attr("status", "inactive");
                var triLeft2 = drawTriangle("#trackersBox",
                                            [boxTopLeft[0]+boxDimentions[2]*0.88,boxTopLeft[1]+navOffset], 
                                            "left", colors(data.index), "active");
                triLeft2.on("click", function() {
                            trackerButtons.attr("class", "trackerButton");
                            svg.select("#trackersBox text")
                               .transition()
                               .attr("x", boxTopLeft[0]+boxDimentions[0]/2);
                            triRight.attr("status", "active");
                            triLeft2.remove();
                            svg.selectAll(".trackerButtonGroup")
                               .transition()
                               .attr("transform", function(d) {
                                   return d3.svg.transform().translate([trackerItemTopLeft[0],d.rectY])();
                               });
                            svg.selectAll(".trackerButtonGroup rect")
                               .transition()
                               .attr("width", boxDimentions[0] * 0.9)
                               .attr("height", trackerItemHeight);
                            svg.selectAll(".trackerButtonGroup text")
                               .attr("visibility", null);
                            svg.selectAll(".trackerButtonGroup text.size")
                               .attr("x", boxDimentions[0] * 0.78)
                               .attr("y", 15)
                               .style("text-anchor", "end");
                            svg.selectAll(".trackerButtonGroup text.label")
                               .attr("x", boxDimentions[0] * 0.05)
                               .text(function(d) {
                                   return d.domain;
                               });
                            svg.selectAll(".trackerButtonGroup polygon")
                               .attr("visibility", null);
                            resumeTrackersBox();
                            showingTreemap = false;
                        })
                        .append("title")
                        .text("Close the treemap.");
                drawTreemap(trackerButtons);
                showingTreemap = true;
            })
            .append("title")
            .text("Show the treemap.");
}

var diagonal = d3.svg.diagonal()
                 .source(function(d) { return {"x":d.source.y, "y":d.source.x}; })
                 .target(function(d) { return {"x":d.target.y, "y":d.target.x}; })
                 .projection(function(d) { return [d.y, d.x]; });

function drawTrackersList(className, data) {
    var token = svg.select("#canvas")
                   .append("g")
                   .attr("id", className);
    
    token.append("rect")
         .attr("x", boxTopLeft[0])
         .attr("y", boxTopLeft[1])
         .attr("rx", 30)
         .attr("ry", 30)
         .attr("width", boxDimentions[0])
         .attr("height", boxDimentions[1])
         .attr("fill", "none")
         .attr("stroke", colors(data.index));
    
    token.append("text")
         .attr("x", boxTopLeft[0]+boxDimentions[0]/2)
         .attr("y", boxTopLeft[1]+55)
         .attr("fill", colors(data.index))
         .style("text-anchor", "middle")
         .text(data.category);
    
    var source = {"x":data.x+data.r,"y":data.y};
    var boxData = [];
    var listType = viewType == "domain" ? "domainList" : "catList";
    for (var i = 0; i < boxVisibleCapacity && i < p1Info[data.id].length; i++) {
        var trackerId = p1Info[data.id][i];
        var y = trackerItemTopLeft[1]+trackerItemHeight*i;
        boxData.push({"index":i,
                      "id":trackerId,
                      "domain":completeData.domainList[trackerId],
                      "p1Length":completeData.thirdPartyDomains[trackerId][listType].length-1,
                      "rectY":y,
                      "link":{"source":source,
                              "target":{"x":boxTopLeft[0]+boxDimentions[0]*0.05,
                                        "y":y+trackerItemHeight*0.5}}});
    }
    
    var trackerButtons = token.selectAll("g")
                              .data(boxData)
                              .enter()
                              .append("g")
                              .attr("class", "trackerButton");
    var trackerButtonsGroups = trackerButtons.append("g")
                              .attr("class", "trackerButtonGroup")
                              .attr("transform", function(d) {
                                  return d3.svg.transform()
                                           .translate([trackerItemTopLeft[0],d.rectY])();
                              });
    trackerButtonsGroups.append("rect")
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .attr("width", boxDimentions[0] * 0.9)
                        .attr("height", trackerItemHeight)
                        .attr("fill", "white")
                        .attr("stroke", colors(data.index))
                        .attr("opacity", 0.15);
    trackerButtonsGroups.append("text")
                        .attr("class", "label")
                        .attr("x", boxDimentions[0] * 0.05)
                        .attr("y", 15)
                        .text(function(d) {
                            return d.domain;
                        });
    trackerButtonsGroups.append("text")
                        .attr("class", "size")
                        .attr("x", boxDimentions[0] * 0.78)
                        .attr("y", 15)
                        .style("text-anchor", "end")
                        .text(function(d) {
                            return "["+d.p1Length+"]";
                        });
    trackerButtons.append("path")
                  .attr("class", "link")
                  .attr("d", function(d) {
                      return diagonal(d.link);
                  });
    return trackerButtons;
}

function drawP1Box(data) {
    var p1Buttons = drawP1List(data);
    p1Buttons.on("mouseover", function() {
                 d3.select(this)
                   .append("title")
                   .text("Click to explore it.");
                 d3.select(this).select("text")
                   .attr("font-weight", "bold");
             })
             .on("mouseout", function() {
                 d3.select(this).select("title").remove();
                 d3.select(this).select("text")
                   .attr("font-weight", null);
             })
             .on("click", function(d) {
                 d3.select(this).select("rect")
                   .transition()
                   .duration(500)
                   .attr("class", "centralBubble")
                   .attr("x", nextScreenX + bubbleCenter[0]-centralBubbleRadius)
                   .attr("y", bubbleCenter[1]-centralBubbleRadius)
                   .attr("width", 2*centralBubbleRadius)
                   .attr("height", 2*centralBubbleRadius)
                   .attr("rx", centralBubbleRadius)
                   .attr("ry", centralBubbleRadius)
                   .each("end", function() {
                       svg.select("#canvas")
                          .transition()
                          .duration(1000)
                          .attr("transform", function() {
                              return d3.svg.transform().translate([-nextScreenX,0])();
                          })
                          .each("end", function() {
                              if (viewType == "domain") {
                                  domainUndoList.push(domainId);
                                  domainId = d.id;
                                  domainRedoList = [];
                              } else {
                                  categoryUndoList.push(categoryId);
                                  categoryId = d.id;
                                  categoryRedoList = [];
                              }
                              loadData(d.id);
                              drawGraph();
                          });
                   });
             });
}

function drawP1List(data) {
    var p1ListLeft = showingTreemap
                     ? p1ListTopLeft[0]+(boxDimentions[2]-boxDimentions[0])
                     : p1ListTopLeft[0];
    var p1List = svg.select("#canvas")
                    .append("g")
                    .attr("id", "p1List");
    if (data.p1Length > 0) {
        p1List.append("text")
              .attr("x", p1ListLeft+p1ListItemDimentions[0]/2)
              .attr("y", p1ListTopLeft[1]+30)
              .attr("fill", "gray")
              .style("text-anchor", "middle")
              .text(function() {
                  if (data.p1Length == 1 )
                      return "Another " + (viewType == "domain" ? "website" : "category");
                  else
                      return data.p1Length + " other " + (viewType == "domain" ? "websites" : "categories");
              });
        p1List.append("text")
              .attr("x", p1ListLeft+p1ListItemDimentions[0]/2)
              .attr("y", p1ListTopLeft[1]+47)
              .attr("fill", "gray")
              .style("text-anchor", "middle")
              .text("also tracked by");
        p1List.append("text")
              .attr("x", p1ListLeft+p1ListItemDimentions[0]/2)
              .attr("y", p1ListTopLeft[1]+64)
              .attr("fill", "gray")
              .style("text-anchor", "middle")
              .text(data.domain);
    }
    
    var source = showingTreemap
                 ? {"x":trackerItemTopLeft[0]+data.x+data.dx,
                    "y":trackerItemTopLeft[1]+data.y+data.dy*0.5}
                 : {"x":boxTopLeft[0]+boxDimentions[0]*0.95,
                    "y":data.rectY+trackerItemHeight*0.5};
    var p1ListData = [];
    var listType = viewType == "domain" ? "domainList" : "catList";
    var list = completeData.thirdPartyDomains[data.id][listType];
    for (var i = 0; p1ListData.length < p1ListVisibleCapacity && i < list.length; i++) {
        var p1Id = list[i];
        if ((p1Id == domainId && viewType == "domain") ||
            (p1Id == categoryId && viewType == "category"))
            continue;
        var y = p1ListTopLeft[1]+70+p1ListItemDimentions[1]*p1ListData.length;
        p1ListData.push({"index":p1ListData.length,
                         "id":p1Id,
                         "label":completeData[listType][p1Id],
                         "y":y,
                         "link":{"source":source,
                                 "target":{"x":p1ListLeft,
                                           "y":y+p1ListItemDimentions[1]*0.5}}});
    }
    
    var p1Buttons = p1List.selectAll("g")
                          .data(p1ListData)
                          .enter()
                          .append("g")
                          .attr("class", "p1Button");
    p1Buttons.append("rect")
             .attr("x", p1ListLeft)
             .attr("y", function(d) {
                 return d.y;
             })
             .attr("rx", 5)
             .attr("ry", 5)
             .attr("width", p1ListItemDimentions[0])
             .attr("height", p1ListItemDimentions[1])
             .attr("opacity", 0.15);
    p1Buttons.append("text")
             .attr("x", p1ListLeft + p1ListItemDimentions[0] * 0.05)
             .attr("y", function(d) {
                 return d.y+15;
             })
             .text(function(d) {
                 return d.label;
             });
    p1Buttons.append("path")
             .attr("class", "link")
             .attr("d", function(d) {
                 return diagonal(d.link);
             });
    
    return p1Buttons;
}

function drawBubbles() {
    svg.selectAll(".catgoryBubble line")
       .transition()
       .attr("x2", function(d) {
           return linkX(d);
       })
       .attr("y2", function(d) {
           return linkY(d);
       });
    svg.selectAll("#bubbleText1")
       .transition()
       .attr("x", function(d) {
           return d.x;
       })
       .attr("y", function(d) {
           return d.y - d.r * 0.1;
       })
       .attr("font-size", function(d) {
           return d.r * 0.23;
       })
       .text(function(d) {
           return d.category.substr(0, 16);
       })
       .attr("visibility", function(d) {
           return d.shrink ? "hidden" : null;
       });
    svg.selectAll("#bubbleText2")
       .transition()
       .attr("x", function(d) {
           return d.x;
       })
       .attr("y", function(d) {
           return d.y + d.r * 0.3;
       })
       .attr("font-size", function(d) {
           return d.r * 0.26;
       })
       .text(function(d) {
           return d.size;
       })
       .attr("visibility", function(d) {
           return d.shrink ? "hidden" : null;
       });
    return svg.selectAll(".catgoryBubble circle")
              .transition()
              .attr("cx", function(d) {
                  return d.x;
              })
              .attr("cy", function(d) {
                  return d.y;
              })
              .attr("r", function(d) {
                  return d.r;
              });
}

function setRightPartVisibility(visibility) {
    svg.select("#trackersBox")
       .attr("visibility", visibility);
    svg.select("#p1List")
       .attr("visibility", visibility);
}

function removeRightPart() {
    showingTreemap = false;
    svg.selectAll(".catgoryBubble")
       .attr("visibility", null)
       .attr("pointer-events", null);
    svg.select("#fakeBubble").remove();
    svg.select("#trackersBox").remove();
    svg.select("#p1List").remove();
}

function refreshTimeline() {
    var undoLength;
    var redoLength;
    var undoLabel;
    var redoLabel;
    if (viewType == "domain") {
        undoLength = domainUndoList.length;
        redoLength = domainRedoList.length;
        undoLabel = completeData.domainList[domainUndoList[undoLength-1]];
        redoLabel = completeData.domainList[domainRedoList[redoLength-1]];
    } else {
        undoLength = categoryUndoList.length;
        redoLength = categoryRedoList.length;
        undoLabel = completeData.catList[categoryUndoList[undoLength-1]];
        redoLabel = completeData.catList[categoryRedoList[redoLength-1]];
    }
    svg.select("#timeline #undo").text(undoLabel);
    svg.select("#timeline #redo").text(redoLabel);
    if (undoLength == 0) {
        svg.select("#timeline #left").attr("status", "inactive");
    } else {
        svg.select("#timeline #left").attr("status", "active");
    }
    if (redoLength == 0) {
        svg.select("#timeline #right").attr("status", "inactive");
    } else {
        svg.select("#timeline #right").attr("status", "active");
    }
    svg.select("#canvas").remove();
}

function drawGraph() {
    var label = viewType == "domain"
                ? completeData.domainList[domainId]
                : completeData.catList[categoryId];
    $("#current-"+viewType).text(label);
    refreshTimeline();
    var canvas = svg.append("g")
                    .attr("id", "canvas");
    // Bubble events
    computeBubblePositions();
    svg.select("#canvas")
       .append("g")
       .attr("id","bubbleWheel")
       .selectAll("g")
       .data(bubbleData)
       .enter()
       .append("g")
       .attr("class", "catgoryBubble")
       .on("click", function(data) {
           if (data.shrink != true) {
               var circle = d3.select(this).select("circle");
               if (d3.mouse(this)[1] > data.y-data.r/2 ||
                   d3.mouse(this)[0] < data.x-data.r/4 ||
                   d3.mouse(this)[0] > data.x+data.r/4) {
                   var thisBubble = d3.select(this);
                   // Move a bubble to the right-most position.
                   rightMostAngle = data.angle;
                   var toRightCount = 0;
                   var circles = reDrawBubbles();
                   circles.each("start", function() {
                       toRightCount++;
                   })
                   .each("end", function() {
                       if ( --toRightCount != 0 )
                           return;
                       // Show the trackers' box.
                       drawTrackersBox(data);
                       thisBubble.attr("visibility", "hidden")
                                 .attr("pointer-events", "none");
                       fakeBubble = svg.select("#bubbleWheel")
                                       .append("g")
                                       .attr("id", "fakeBubble");
                       fakeBubble.append("circle")
                                 .attr("class", "bubbleSurface")
                                 .attr("cx", data.x)
                                 .attr("cy", data.y)
                                 .attr("r", data.r)
                                 .attr("fill", colors(data.index));
                       fakeBubble.append("circle")
                                 .attr("class", "bubbleEdge")
                                 .attr("cx", data.x)
                                 .attr("cy", data.y)
                                 .attr("r", data.r)
                                 .attr("stroke", colors(data.index));
                       fakeBubble.selectAll("circle")
                                 .transition()
                                 .attr("r", 5);
                       fakeBubble.append("line")
                                 .attr("class", "link")
                                 .attr("x1", bubbleCenter[0])
                                 .attr("y1", bubbleCenter[1])
                                 .attr("x2", data.x+data.r)
                                 .attr("y2", data.y)
                                 .transition()
                                 .attr("x2", data.x-5);
                       svg.selectAll("#trackersBox path.link")
                          .transition()
                          .attr("d", function(d) {
                              d.link.source.x = data.x+5;
                              return diagonal(d.link);
                          });
                   });
                   d3.select("#closeButton").remove();
                   d3.select("#categoryTooltip").remove();
                   removeRightPart();
               } else {
                   // Shrink a bubble
                   setSkipedCategoryIdDict(data.id, true)
                   data.shrink = bubbleData[data.index].shrink = true;
                   data.R = smallRadius;
                   data.r = shrinkRadius;
                   d3.select(this).append("title").text(data.category);
                   shrinkTransition(d3.select(this), data);
                   d3.select("#closeButton").remove();
                   d3.select("#categoryTooltip").remove();
                   removeRightPart();
               }
           } else {
               // Expand a bubble
               setSkipedCategoryIdDict(data.id, false);
               data.shrink = bubbleData[data.index].shrink = false;
               data.R = bigRadius;
               data.r = data.r;
               d3.select(this).select("title").remove();
               shrinkTransition(d3.select(this), data);
               removeRightPart();
           }
       })
       .on("mouseover", function(data) {
           setRightPartVisibility("hidden");
           if (!data.shrink) {
               // Enlarge the bubble
               data.r = bubbleSizeRange[0]*1.05;
               data.x = bubbleX(data);
               data.y = bubbleY(data);
               var enlargeCount = 0;
               var circles = drawBubbles();
               circles.each("start", function() {
                   enlargeCount++;
               })
               .each("end", function() {
                   if ( --enlargeCount != 0 )
                       return;
                   // Display a close button
                   if (data.shrink != true) {
                       var y = data.y-data.r*3/4;
                       var r = data.r/4;
                       drawCloseButton(data.x, y, r);
                   }
                   // Display a tooltip
                   drawTrackersList("categoryTooltip", data);
               });
           } else {
               drawTrackersList("categoryTooltip", data);
           }
       })
       .on("mouseout", function(data) {
           setRightPartVisibility(null);
           reDrawBubbles();
           d3.select("#closeButton").remove();
           d3.select("#categoryTooltip").remove();
       });
    // Draw the central bubble
    canvas.append("circle")
          .attr("class", "centralBubble")
          .attr("cx", bubbleCenter[0])
          .attr("cy", bubbleCenter[1])
          .attr("r", centralBubbleRadius)
          .append("title")
          .text(label);
    // Initial the bubbles
    svg.selectAll(".catgoryBubble")
       .append("circle")
       .attr("class", "bubbleSurface")
       .attr("cx", bubbleCenter[0])
       .attr("cy", bubbleCenter[1])
       .attr("r", centralBubbleRadius)
       .attr("fill", function(d, i) {
           return colors(i);
       });
    svg.selectAll(".catgoryBubble")
       .append("circle")
       .attr("class", "bubbleEdge")
       .attr("cx", bubbleCenter[0])
       .attr("cy", bubbleCenter[1])
       .attr("r", centralBubbleRadius)
       .attr("stroke", function(d, i) {
           return colors(i);
       });
    svg.selectAll(".catgoryBubble")
       .append("line")
       .attr("class", "link")
       .attr("x1", bubbleCenter[0])
       .attr("y1", bubbleCenter[1])
       .attr("x2", bubbleCenter[0])
       .attr("y2", bubbleCenter[1]);
    svg.selectAll(".catgoryBubble")
       .append("text")
       .attr("class", "bubbleText")
       .attr("id", "bubbleText1");
    svg.selectAll(".catgoryBubble")
       .append("text")
       .attr("class", "bubbleText")
       .attr("id", "bubbleText2");
    drawBubbles();
}