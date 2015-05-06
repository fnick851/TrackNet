// display variables
var width=4;		// width of each block
var height=17; 		// active_category div height
var padding=16; 	// pixels between rows
var initHeight=40; 	// search form height
var offset=5; 		// left margin for labels
var trackedColor = 0.6; // opacity coding
var cookieColor = 1.0;
var untrackedColor = 0.25;
var colors = d3.scale.category10();

// global vars
var selectedBlock = null;
var td;
var firstparty, thirdparty;
var categories;
var x;
var active_categories;
var other_categories;
var curView = 2; // 0 for website, 1 for category, 2 for tracking level + uid
var curSearch = 0; // website, 1 for category
var id_list; //Website/Category ID list

function websiteSearch() {
	curSearch = 0;
	d3.select("#websearch").attr("class", "selected");
	d3.select("#categorysearch").attr("class", "");
	
	initializeSearchBox();
	loadData();
}

function categorySearch() {
	curSearch = 1;
	d3.select("#categorysearch").attr("class", "selected");
	d3.select("#websearch").attr("class", "");
	
	initializeSearchBox();
	loadData();
}

function websiteView() {
	curView = 0;
	d3.select("#webview").attr("class", "selected");
	d3.select("#categoryview").attr("class", "");
	d3.select("#orderview").attr("class", "");
	firstparty = firstparty.sort(function(a,b) {
		var aTracking = (!isTracked(a.uid))?"C":(hasCookie(a.uid))?"A":"B";
		var bTracking = (!isTracked(b.uid))?"C":(hasCookie(b.uid))?"A":"B";
		return d3.ascending(a.domain+aTracking,
							b.domain+bTracking);
	});
	loadData();
}

function categoryView() {
	curView = 1;
	d3.select("#webview").attr("class", "");
	d3.select("#categoryview").attr("class", "selected");
	d3.select("#orderview").attr("class", "");
	firstparty = firstparty.sort(function(a,b) {
		var aTracking = (!isTracked(a.uid))?"C":(hasCookie(a.uid))?"A":"B";
		var bTracking = (!isTracked(b.uid))?"C":(hasCookie(b.uid))?"A":"B";
		return d3.ascending(a.category+aTracking+a.domain,
							b.category+bTracking+b.domain);
	});
	loadData();
}

function orderView() {
	curView = 2;
	d3.select("#webview").attr("class", "");
	d3.select("#categoryview").attr("class", "");
	d3.select("#orderview").attr("class", "selected");
	firstparty = firstparty.sort(function(a,b) {
		var aTracking = (!isTracked(a.uid))?"C":(hasCookie(a.uid))?"A":"B";
		var bTracking = (!isTracked(b.uid))?"C":(hasCookie(b.uid))?"A":"B";
		return d3.ascending(aTracking+a.uid,
							bTracking+b.uid);
	});
	loadData();
}

function runMain() {
	d3.json("../data/domainCategoryDict.json", function(error, json) {
		if (error) return alert("Error loading categories: " + error);
		categories = json;
		
		d3.json("../data/257.data.json", function(error, json) {
		if (error) return alert("Error loading data: " + error);
			td = json;
			
			firstparty = td["first_party"];
			firstparty = addCategoriesToJson(firstparty);
			
			thirdparty = td["third_party"];
			thirdparty = addCategoriesToJson(thirdparty);
			
			initializeCategories();
			initializeSearchBox();
			visualizeit();
		});
	});

	d3.json("../data/257.ids.json", function(error, json) {
		if (error) return alert("Error loading categories: " + error);
		id_list = json
	});
}


function isTracked(domainId) {
	// parameter: first-party domain's UID
	// return: true/false if tracked
	var thirdparty = td["third_party"];
	// is there a d3 way to do this?
	for (i=0;i<thirdparty.length;i++) {
		if (thirdparty[i]['uid'] == domainId)
			return true;
		//else if (thirdparty[i]['uid'] > domainId) // save on time, since they are ordered by uid
		//	return false;
	}
	return false;
}

function getDomain(domainId) {
	// return domain name from first-party given a uid
	for (i=0;i<firstparty.length;i++) {
		if (firstparty[i]['uid'] == domainId)
			return firstparty[i]['domain'];
	}
}

function hasCookie(domainId) {
	// parameter: first-party domain's UID
	// return: true/false if a third party tracking it has_cookie is true
	var thirdparty = td["third_party"];
	for (i=0;i<thirdparty.length;i++) {
		if (thirdparty[i]['uid'] == domainId && thirdparty[i]['has_cookie'] == 1)
			return true;
		//else if (thirdparty[i]['uid'] > domainId) // save on time, since they are ordered by uid
		//	return false;
	}
	return false;
}

function addCategoriesToJson(datalist) {
	for (i=0;i<datalist.length;i++) {
		datalist[i]['category'] = categories[datalist[i]['domain']];
	}
	return datalist;
}

function initializeCategories() {
	active_categories = {};
	other_categories = {};
	
	for (var searchType in [0,1]) {
		clist = {};
		active_categories[searchType] = [];
		other_categories[searchType] = [];
		if (searchType == 1) {
			// searching by category
			for (var key in thirdparty) {
				if (getDomain(thirdparty[key].uid) != thirdparty[key].domain) { // ignore self-tracking					
					if (clist[thirdparty[key].category] == null) {
						clist[thirdparty[key].category] = {};
						clist[thirdparty[key].category][thirdparty[key].uid] = 1;
					} else if (clist[thirdparty[key].category][thirdparty[key].uid] == null) {
						clist[thirdparty[key].category][thirdparty[key].uid] = 1;
					} else { // count each tracker, not just each visit
						clist[thirdparty[key].category][thirdparty[key].uid]++;
					}
				}
			}
		} else {
			// searching by websites
			for (var key in thirdparty) {
				if (getDomain(thirdparty[key].uid) != thirdparty[key].domain) { // ignore self-tracking					
					if (clist[thirdparty[key].domain] == null) {
						clist[thirdparty[key].domain] = {};
						clist[thirdparty[key].domain][thirdparty[key].uid] = 1;
					} else {
						clist[thirdparty[key].domain][thirdparty[key].uid] = 1;
					}
				}
			}
		}
		
		// tally up + convert into tuples to sort descending by count
		var tuples = [];
		
		for (var key in clist) {
			var total = 0;
			for (var visit in clist[key]) {
				total += clist[key][visit];
			}
			tuples.push([key, total]);
		}

		tuples.sort(function(a, b) {
			a = a[1];
			b = b[1];
			return a < b ? 1 : (a > b ? -1 : 0);
		});
		
		for (var i = 0; i < tuples.length; i++) {
			var key = tuples[i][0];
			var value = tuples[i][1];
			
			if (i < 5) { // top N categories display by default
				active_categories[searchType].push({value:key, data:value, enabled:false});
			} else {
				other_categories[searchType].push({value:key, data:value, enabled:false});
			}
		}
	}
}

function initializeSearchBox() {
	// set up search box
	// clear div
	$('#active_categories').empty();
	if (curSearch == 1)
		$('#autocomplete').attr("placeholder", "Search for category");
	else
		$('#autocomplete').attr("placeholder", "Search for website");
	
	var unionTotal = 0;
	for(var i = 0; i < active_categories[curSearch].length; i++)
	{
		var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);">&times;</button>' +
			'<span class="item_name">' + active_categories[curSearch][i].value + '</span> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + active_categories[curSearch][i].data + '</span></i>' +
			'<button class="move_up" onclick="moveUp(this);">&uparrow;</button>' +
			'<button class="move_down" onclick="moveDown(this);">&downarrow;</button>' +
			'</div>';

		$('#active_categories').append(html);
		
		unionTotal += active_categories[curSearch][i].data;
	}
	
	// add union row label
	$('#active_categories').append(
		'<div class="active_category_item">' +
		'<button class="delete_item">&nbsp;</button>' +
		'<span class="item_name">All Selected</span>' + '<span class="separator">|</span> ' +
		'<i><span class="item_percent">' + unionTotal + '</span></i>' +
		'</div>');
	
	// setup autocomplete function pulling from categories[] array
	$('#autocomplete').autocomplete({
		minLength: 0,
		lookup: other_categories[curSearch],
		onSelect: function (item) {
			var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);">&times;</button>' +
			'<span class="item_name">' + item.value + '</span> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + item.data + '</span></i>' +
			'<button class="move_up" onclick="moveUp(this);">&uparrow;</button>' +
			'<button class="move_down" onclick="moveDown(this);">&downarrow;</button>' +
			'</div>';

			$('#active_categories').append(html);
			document.getElementById('autocomplete').value = '';

			for (var i = 0; i < other_categories[curSearch].length; i++) {
				if (other_categories[curSearch][i].value == item.value)
					other_categories[curSearch].splice(i, 1);
			}

			active_categories[curSearch].push(item);
			$(document).trigger('click');
			
			// update
			initializeSearchBox();
			loadData();
		}
    });
}

function getCategoryList(datalist) {
	cats = [];
	for (i=0;i<active_categories[curSearch].length;i++){
		cats.push(active_categories[curSearch][i]["value"]);
	}
	return cats;
}

function getHeightForCat(step, category, categoryList) {
	h = initHeight-step+padding;
	for (i=0;i<categoryList.length;i++) {
		if (categoryList[i] == category)
			return h;
		h += step + padding;
	}
	return -100;
}

function getFirstPartyCategory(uid) {
	// return the first party category classification, given a uid
	for (i=0;i<firstparty.length;i++) {
		if (firstparty[i].uid == uid) {
			d = firstparty[i];
			if (curView == 0) {
				return d.domain;
			} else if (curView == 1) {
				return d.category;
			} else if (curView == 2) {
				//trackingLevel = (!isTracked(d.uid))?"Untracked":(hasCookie(d.uid))?"Tracked with Cookie":"Tracked";
				trackingLevel = "All Sites";
				return trackingLevel;
			}
		}
	}
}

function visualizeit() {
	if (curView == 0)
		websiteView();
	else if (curView == 1)
		categoryView();
	else if (curView == 2)
		orderView();
}

function getStringWidth(string) { 
    var text = d3.select("svg").append("text")
        .attr("x", 0)
        .attr("y", 0)
        .style("opacity", 0)
        .text(string);
	return text.node().getBBox().width;
}

function loadData() {
	categoryList = getCategoryList(firstparty);
	
	d3.select("#chart").select("svg").remove();
	var totalWidth = width*firstparty.length+offset;
	var totalHeight = initHeight+padding+(height+padding)*(categoryList.length+1); // +1 for union row
	var root = d3.select("#chart").append('svg')
		.attr('width', totalWidth)
		.attr('height', totalHeight+padding); // for the union row labels
	
	root.append("rect")
		.attr('id', "highlight")
		.attr('x', -width*2)
		.attr('y', padding)
		.attr('width', width)
		.attr('height', totalHeight)
		.attr('fill', '#ff0')
		.attr('opacity', 0.5);
		
	root.append("rect")
		.attr('id', "mousehighlight")
		.attr('x', -width*2)
		.attr('y', padding)
		.attr('width', width)
		.attr('height', totalHeight)
		.attr('fill', '#ff0')
		.attr('opacity', 0.2);
	
	// reset
	x = offset;
	xpos = {};
	var categoryDivs = [];
	var lastCat;
	root.selectAll("g").data(firstparty).enter()
		.append("g")
		.on("mouseover", function() {
				var block = d3.select(this);
				
				d3.select("rect#mousehighlight")
					.attr('x', block[0][0].childNodes[0].getAttribute("x"))
					.attr('y', padding);
				
				block.transition().duration(10).attr('opacity', 0.5);
            })
		.on("mouseout", function() {
				var block = d3.select(this);
				$(".iframe").colorbox({iframe:true, width:"90%", innerHeight:"560px"});

				block.transition().duration(10).attr('opacity', 1.0);
			})
		.on("click", function() {
				block = d3.select(this);
				d3.select("rect#highlight")
					.attr('x', block[0][0].childNodes[0].getAttribute("x"))
					.attr('y', padding);
			})
		.append("rect")
		.attr('x', function(d) {
				x += width;
				xpos[d.uid] = x;
				
				dIsTracked = isTracked(d.uid);
				
				// update category divs
				if (curView == 0) {
					if (d.domain != lastCat) {
						categoryDivs.push({'name':d.domain, 'pos':x, 'count':0, 'trackedCount':0});
						lastCat = d.domain;
					}
				} else if (curView == 1) {
					if (d.category != lastCat) {
						categoryDivs.push({'name':d.category, 'pos':x, 'count':0, 'trackedCount':0});
						lastCat = d.category;
					}
				} else if (curView == 2) {
					//trackingLevel = (!dIsTracked)?"Untracked":(hasCookie(d.uid))?"Tracked with Cookie":"Tracked";
					trackingLevel = "All Sites";
					if (trackingLevel != lastCat) {
						categoryDivs.push({'name':trackingLevel, 'pos':x, 'count':0, 'trackedCount':0});
						lastCat = trackingLevel;
					}
				}
				if (dIsTracked)
					categoryDivs[categoryDivs.length-1].trackedCount++;
				
				categoryDivs[categoryDivs.length-1].count++;
				return x;
			})
		.attr('y', padding)
		.attr('width', width)
		.attr('height', initHeight)
		.attr('fill', function(d) {
				/*
				if (curSearch == 1)
					return colors(d.category);
				return colors(d.domain);
				*/
				// monochrome per line
				return "#000";
			})
		.attr('opacity', function(d) {
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		//.append("svg:title")
		.attr("data-tooltip", function(d) {
			                  $(".iframe").colorbox({iframe:true, width:"90%", innerHeight:"560px"});

				return '<a class="iframe" '+ "href='../bubbles/popup.html?domain=" + id_list["domainDict"][d.domain] +"'>" + d.domain + "</a><br />"+'<a class="iframe" '+ "href='../bubbles/popup.html?category=" + id_list["catDict"][d.category] + "'>" + d.category + "</a>";
			})
		//.text(function(d) { return d.domain + "\n" + d.category; })
		;
		
	// qtip2 tooltips
	$('g').qtip({
		hide: {
			delay: 100,
			fixed: true
		},
		content: {
			text: function(event, api) {
				return $(this)[0].firstChild.getAttribute('data-tooltip');
			}
		},
		position: {
			my: 'top center',
			at: 'bottom center'
		},
		style: {
			classes: 'qtip-light qtip-rounded customqtip'
		},
		tip: true
	});
	
	// add individual blocks for third-party
	blocklist = {};
	unionlist = {};
	percentlist = {}; // to calculate percent of third-party groups tracking first-party groups
	x = offset;
	y = height+width;
	root.selectAll("g#tp").data(thirdparty).enter()
		.append("rect")
		.attr('x', function(d) {
				return xpos[d.uid];
				//x += width; return x;
			})
		.attr('y', function(d) {
				h = 0;
				thirdPartyCategory = '';
				if (curSearch == 1) {
					thirdPartyCategory = d.category;
				} else {
					thirdPartyCategory = d.domain;
				}
				h = y + padding + getHeightForCat(height, thirdPartyCategory, categoryList);
				
				d.ypos = h;
				return h;
			})
		.attr('width', width)
		.attr('height', height)
		.attr('fill', function(d) {
				if (curSearch == 1)
					return colors(d.category);
				return colors(d.domain);
			})
		.attr('opacity', function(d) {
				if (getDomain(d.uid) == d.domain) {
					return 0; // do not show self-tracking
				}
				thirdPartyCategory = '';
				if (curSearch == 1) {
					thirdPartyCategory = d.category;
				} else {
					thirdPartyCategory = d.domain;
				}
				
				// initialize percent list if needed
				firstPartyCategory = getFirstPartyCategory(d.uid);
				h = d.ypos;
				if (firstPartyCategory in percentlist) {
					if (thirdPartyCategory in percentlist[firstPartyCategory]) {
						percentlist[firstPartyCategory][thirdPartyCategory].height = h;
						percentlist[firstPartyCategory][thirdPartyCategory].color = colors(thirdPartyCategory);
					} else
						percentlist[firstPartyCategory][thirdPartyCategory] = {'height':h, 'count':0, 'color':colors(thirdPartyCategory)};
				} else {
					percentlist[firstPartyCategory] = {};
					percentlist[firstPartyCategory][thirdPartyCategory] = {'height':h, 'count':0, 'color':colors(thirdPartyCategory)};
				}
				
				unionlist[d.uid] |= d.has_cookie;
				if (!(d.uid + thirdPartyCategory in blocklist)) {
					// color in the first time
					blocklist[d.uid + thirdPartyCategory] = d.has_cookie;
					percentlist[firstPartyCategory][thirdPartyCategory].count++;
					return (d['has_cookie'] == 1)?cookieColor:trackedColor;
				} else if (d.has_cookie == 1) {
					// or if it's tracked by cookie
					blocklist[d.uid + thirdPartyCategory] = 1;
					return cookieColor;
				} else {
					// but otherwise, do not show, or multiple tracked blocks will stack up and look wrong
					return 0;
				}
			})
		.append("svg:title")
		.text(function(d) { return d.domain; })
		;
	
	// add 'union' row at bottom
	x = offset;
	y = height+width;
	blocklist = {};
	unionpercents = {};
	root.selectAll("g#union").data(thirdparty).enter()
		.append("rect")
		.attr('x', function(d) {
				return xpos[d.uid];
			})
		.attr('y', function(d) {
				origHeight = -100;
				if (curSearch == 1)
					origHeight = getHeightForCat(height, d.category, categoryList);
				else
					origHeight = getHeightForCat(height, d.domain, categoryList);
				if (origHeight == -100)
					return origHeight;
				return totalHeight - height;
			})
		.attr('width', width)
		.attr('height', height)
		.attr('fill', function(d) {
				return "#000";
			})
		.attr('opacity', function(d) {
				if (getDomain(d.uid) == d.domain) {
					return 0; // do not show self-tracking
				}
				var trackVal = unionlist[d.uid];
				origHeight = -100;
				if (curSearch == 1)
					origHeight = getHeightForCat(height, d.category, categoryList);
				else
					origHeight = getHeightForCat(height, d.domain, categoryList);
				if (origHeight != -100)
				{
					if (trackVal != -1) {
						fpcat = getFirstPartyCategory(d.uid);
						if (!(fpcat in unionpercents))
							unionpercents[fpcat] = 0;
						unionpercents[fpcat]++;
					}
					unionlist[d.uid] = -1; // so we don't draw this again
					if (trackVal == 1)
						return cookieColor;
					else if (trackVal == 0)
						return trackedColor;
				}
				return 0;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; })
		;
	
	// draw category divisions
	root.selectAll("g#catDiv").data(categoryDivs).enter()
		.append("rect")
		.attr('x', function(d) { return d.pos; })
		.attr('y', 0)
		.attr('width', 1)
		.attr('height', totalHeight)
		.attr('fill', "#000")
		;
	
	// calculate category division widths
	var totalCats = 0;
	categoryDivs.push({'pos':totalWidth});
	for (var i = 0; i < categoryDivs.length-1; i++) {
		categoryDivs[i]['width'] = categoryDivs[i+1].pos - categoryDivs[i].pos;
		totalCats += categoryDivs[i].count;
	}
	categoryDivs.pop();
	
	// add category labels
	root.selectAll("g#catLabels").data(categoryDivs).enter()
		.append("a")
		.attr("xlink:href", function(d){
			if(!id_list["catDict"][d.name])
				return "../bubbles/popup.html?domain=" + id_list["domainDict"][d.name];
			else
				return "../bubbles/popup.html?category=" + id_list["catDict"][d.name];
		})
		.attr("text-anchor", "middle")
		.attr('x', function(d) { return d.pos + d.width/2; })
		.attr('y', padding*3/4)
		.attr("class", "iframe")

		
		.append("text")
		.attr('fill', "#000")
		.attr("text-anchor", "middle")
		.attr('x', function(d) { return d.pos + d.width/2; })
		.attr('y', padding*3/4)
		.text(function(d) {
			var txt = d.name;
			txtwidth = getStringWidth(txt);
			if (txtwidth < d.width)
				return txt;
			else
				return '';
		})
		;

	$(".iframe").colorbox({iframe:true, width:"90%", innerHeight:"560px"});
	
	// add category percents
	root.selectAll("g#catPercents").data(categoryDivs).enter()
		.append("text")
		.attr("text-anchor", "middle")
		.attr('x', function(d) { return d.pos + d.width/2; })
		.attr('y', initHeight+padding+9)
		.attr('fill', "#000")
		.text(function(d) {
			var txt = (d.trackedCount / d.count * 100).toFixed(1) + "%";
			txtwidth = getStringWidth(txt);
			if (txtwidth < d.width)
				return txt;
			else
				return '';
		})
		.append("svg:title")
		.text(function(d) { return (d.trackedCount / d.count * 100).toFixed(1) + "% of '" + d.name + "' visits were tracked"; });
		;
	
	// add third-party percents
	for (j=0; j<categoryDivs.length; j++) {
		fpcat = categoryDivs[j];
		// get total counts for that category
		if (fpcat.name in percentlist) { // because we don't have an "Untracked" column
			for (tpcat in percentlist[fpcat.name]) {
				p = percentlist[fpcat.name][tpcat];
				var txt = (p.count / categoryDivs[j].count * 100).toFixed(1) + "%";
				txtwidth = getStringWidth(txt);
				if (txtwidth >= categoryDivs[j].width)
					txt = '';
				
				position = percentlist[fpcat.name][tpcat].height;
				d3.select("svg")
					.append("text")
					.attr("text-anchor", "middle")
					.attr("x", categoryDivs[j].pos + categoryDivs[j].width/2)
					.attr("y", position + height + 9)
					.attr("fill", percentlist[fpcat.name][tpcat].color)
					.text(txt)
					.append("svg:title")
					.text(function(d) { return txt + " of '" + categoryDivs[j].name + "' visits were tracked by " + tpcat; });
					;
			}
		}

	}
	
	// add union row percents
	for (key in unionpercents) {
		var j = 0;
		for (j=0;j<categoryDivs.length;j++) {
			if (categoryDivs[j].name == key)
				break;
		}
		result = unionpercents[key] / categoryDivs[j].count * 100;
		var txt = result.toFixed(1) + "%";
		txtwidth = getStringWidth(txt);
		if (txtwidth >= categoryDivs[j].width)
			txt = '';
	
		d3.select("svg")
			.append("text")
			.attr("text-anchor", "middle")
			.attr("x", categoryDivs[j].pos + categoryDivs[j].width/2)
			.attr("y", totalHeight+9)
			.attr("fill", "#555")
			.text(txt)
			.append("svg:title")
			.text(function(d) { return txt + " of visits to '" + categoryDivs[j].name + "' were tracked by currently selected trackers"; });
			;
	}
}

function remove_active_item(remove_item)
{
    var item_value = $(remove_item).next().html();
    var item;
    $(remove_item).parent().remove();
    

    for (var i = 0; i < active_categories[curSearch].length; i++) 
    {
        if (active_categories[curSearch][i].value == item_value) 
        {
            item = active_categories[curSearch][i];
            active_categories[curSearch].splice(i, 1);
        }
    }

    other_categories[curSearch].push(item);
	
	// update
	initializeSearchBox();
	loadData();
}

function moveUp(moveItem) {
    var item_value = $(moveItem).prev().prev().prev().html();
    
	for (var i = 1; i < active_categories[curSearch].length; i++)  {
		if (active_categories[curSearch][i].value == item_value)  {
			var item = active_categories[curSearch][i];
			var prev = active_categories[curSearch][i-1];
			active_categories[curSearch][i-1] = item;
			active_categories[curSearch][i] = prev;
			
			var itemDiv = $(moveItem).parent();
			itemDiv.prev().before(itemDiv);
			
			initializeSearchBox();
			loadData();
			return;
        }
    }
}

function moveDown(moveItem) {
    var item_value = $(moveItem).prev().prev().prev().prev().html();
    
	for (var i = 0; i < active_categories[curSearch].length-1; i++)  {
		if (active_categories[curSearch][i].value == item_value)  {
			var item = active_categories[curSearch][i];
			var next = active_categories[curSearch][i+1];
			active_categories[curSearch][i+1] = item;
			active_categories[curSearch][i] = next;
			
			var itemDiv = $(moveItem).parent();
			itemDiv.next().after(itemDiv);
			
			initializeSearchBox();
			loadData();
			return;
        }
    }
}