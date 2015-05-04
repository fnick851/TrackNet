// display variables
var width=4;		// width of each block
var height=17; 		// active_category div height
var padding=16; 	// pixels between rows
var initHeight=40; 	// search form height
var offset=5; 		// left margin for labels
var trackedColor = 0.6; // opacity coding
var cookieColor = 1.0;
var untrackedColor = 0.3;
var colors = d3.scale.category10();

// global vars
var selectedBlock = null;
var td;
var firstparty, thirdparty;
var categories;
var x;
var active_categories;
var other_categories;
var curView = 0; // website, 1 for category
var curSearch = 0; // website, 1 for category

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
	firstparty = firstparty.sort(function(a,b) {
		var aTracking = (!isTracked(a.uid))?"C":(hasCookie(a.uid))?"A":"B";
		var bTracking = (!isTracked(b.uid))?"C":(hasCookie(b.uid))?"A":"B";
		return d3.ascending(a.category+aTracking+a.domain,
							b.category+bTracking+b.domain);
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
			
			/*
			// combine third-party visits under same domain for single blocks
			thirdparty = [];
			var lastUid;
			var lastDomain;
			tp = {};
			for (var key in thirdpartyOrig) {
				if (thirdpartyOrig[key].uid == lastUid) {
					if (!tp[thirdpartyOrig[key].domain])
						tp[thirdpartyOrig[key].domain] = thirdpartyOrig[key];
					tp[thirdpartyOrig[key].domain].has_cookie |= thirdpartyOrig[key].has_cookie;
				} else {
					for (var t in tp) {
						thirdparty.push(tp[t]);
					}
					tp = {};
					lastUid = thirdpartyOrig[key].uid;
					lastDomain = thirdpartyOrig[key].domain;
				}
			}
			*/
			
			initializeCategories();
			initializeSearchBox();
			visualizeit();		  
		});
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
				//if (getDomain(thirdparty[key].uid) != thirdparty[key].domain) { // ignore self-tracking					
					if (clist[thirdparty[key].category] == null) {
						clist[thirdparty[key].category] = {};
						clist[thirdparty[key].category][thirdparty[key].uid] = 1;
					} else //if (clist[thirdparty[key].category][thirdparty[key].uid] == null) {
						clist[thirdparty[key].category][thirdparty[key].uid] = 1;
					//} else { // count each tracker, not just each visit
					//	clist[thirdparty[key].category][thirdparty[key].uid]++;
					//}
				//}
			}
		} else {
			// searching by websites
			for (var key in thirdparty) {
				//if (getDomain(thirdparty[key].uid) != thirdparty[key].domain) { // ignore self-tracking					
					if (clist[thirdparty[key].domain] == null) {
						clist[thirdparty[key].domain] = {};
						clist[thirdparty[key].domain][thirdparty[key].uid] = 1;
					} else //if (clist[thirdparty[key].domain][thirdparty[key].uid] == null) {
						clist[thirdparty[key].domain][thirdparty[key].uid] = 1;
					//} else { // count each tracker, not just each visit
					//	clist[thirdparty[key].domain][thirdparty[key].uid]++;
					//}
				//}
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

function visualizeit() {
	if (curView == 0)
		websiteView();
	else
		categoryView();
}

function loadData() {
	categoryList = getCategoryList(firstparty);
	
	d3.select("#chart").select("svg").remove();
	var totalWidth = width*firstparty.length+offset;
	var totalHeight = initHeight+padding+(height+padding)*(categoryList.length+1); // +1 for union row
	var root = d3.select("#chart").append('svg')
		.attr('width', totalWidth)
		.attr('height', totalHeight);
	
	// reset
	x = offset;
	xpos = {};
	var categoryDivs = [];
	var lastCat;
	root.selectAll("g").data(firstparty).enter()
		.append("g")
		.on("mouseover", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 0.5);
				var details = d3.select("#details");
				details.selectAll('p').remove();
				details.append('p')
					.append("a")
					.attr("href", "#")
					.text(block.data()[0].domain)
					.attr("class", "domain");
				details.append('p')
					.append("a")
					.attr("href", "#")
					.text(block.data()[0].category)
					.attr("class", "category");	
				
				var divx = parseInt(block.select("rect").attr("x")) + 275; // div offset - 1/2 tooltip width
				details.transition()
					.duration(200)
					.style("opacity", .9)
					.style("left", divx + "px")
					.style("top", initHeight+height/2 + "px");
            })
		.on("mouseout", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 1.0);
				var details = d3.select("#details");
				details.selectAll('p').remove();
				details.transition()
					.duration(200)
					.style("opacity", 0);
				
				if (selectedBlock != null) {
					details.append('p')
						.text(selectedBlock.data()[0].domain)
						.attr("class", "domain");
					details.append('p')
						.text(selectedBlock.data()[0].category)
						.attr("class", "category");
				}
			})
		.on("click", function() {
				if (selectedBlock != null) {
					selectedBlock[0][0].removeChild(selectedBlock[0][0].childNodes[1]);
				}
				
				selectedBlock = d3.select(this);
				
				var xoffset = d3.select("svg")[0][0].scrollLeft;
				console.log(xoffset); // nope
				console.log(selectedBlock.data()[0].uid); // yes
				
				selectedBlock.append("rect")
					.attr('x', selectedBlock[0][0].childNodes[0].getAttribute("x"))
					.attr('y', padding)
					.attr('width', width)
					.attr('height', totalHeight)// + parseInt(selectedBlock[0][0].childNodes[1].getAttribute("y"))
					.attr('fill', '#ff0')
					.attr('opacity', 0.5);
			})
		.append("rect")
		.attr('x', function(d) {
				x += width;
				xpos[d.uid] = x;
				if (curView == 1) {
					if (d.category != lastCat) {
						categoryDivs.push({'name':d.category, 'pos':x});
						lastCat = d.category;
					}
				} else {
					if (d.domain != lastCat) {
						categoryDivs.push({'name':d.domain, 'pos':x});
						lastCat = d.domain;
					}
				}
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
		//.text(function(d) { return d.domain; })
		;
	
	// add individual blocks for third-party
	blocklist = {};
	unionlist = {};
	x = offset;
	y = height+width;
	root.selectAll("g#tp").data(thirdparty).enter()
		.append("rect")
		.attr('x', function(d) {
				return xpos[d.uid];
				//x += width; return x;
			})
		.attr('y', function(d) {
				if (curSearch == 1)
					return y + padding + getHeightForCat(height, d.category, categoryList);
				return y + padding + getHeightForCat(height, d.domain, categoryList);
			})
		.attr('width', width)
		.attr('height', height)
		.attr('fill', function(d) {
				if (curSearch == 1)
					return colors(d.category);
				return colors(d.domain);
			})
		.attr('opacity', function(d) {
				//if (getDomain(d.uid) == d.domain) {
				//	return 0; // do not show self-tracking
				//}
				unionlist[d.uid] |= d.has_cookie;
				if (curSearch == 0) {
					if (!(d.uid + d.domain in blocklist)) {
						// color in the first time
						blocklist[d.uid + d.domain] = d.has_cookie;
						return (d['has_cookie'] == 1)?cookieColor:trackedColor;
					} else if (d.has_cookie == 1) {
						// or if it's tracked by cookie
						blocklist[d.uid + d.domain] = 1;
						return cookieColor;
					} else {
						// but otherwise, do not show, or multiple tracked blocks will stack up and look wrong
						return 0;
					}
				} else {
					if (!(d.uid + d.category in blocklist)) {
						// color in the first time
						blocklist[d.uid + d.category] = d.has_cookie;
						return (d.has_cookie == 1)?cookieColor:trackedColor;
					} else if (blocklist[d.uid + d.category] == 1) {
						// or if it's tracked by cookie
						return cookieColor;
					} else {
						// but otherwise, do not show, or multiple tracked blocks will stack up and look wrong
						return 0;
					}
				}
				//return (d['has_cookie'] == 1)?cookieColor:trackedColor;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; })
		;
	
	// add 'union' row at bottom
	x = offset;
	y = height+width;
	blocklist = {};
	root.selectAll("g#union").data(thirdparty).enter()
		.append("rect")
		.attr('x', function(d) {
				return xpos[d.uid];
				//x += width; return x;
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
				//if (getDomain(d.uid) == d.domain) {
				//	return 0; // do not show self-tracking
				//}
				var trackVal = unionlist[d.uid];
				origHeight = -100;
				if (curSearch == 1)
					origHeight = getHeightForCat(height, d.category, categoryList);
				else
					origHeight = getHeightForCat(height, d.domain, categoryList);
				if (origHeight != -100)
				{
					unionlist[d.uid] = -1;
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
	
	// draw category divisions and labels
	root.selectAll("g#catDiv").data(categoryDivs).enter()
		.append("rect")
		.attr('x', function(d) { return d.pos; })
		.attr('y', padding)
		.attr('width', 1)
		.attr('height', totalHeight)
		.attr('fill', "#000")
		;
	
	// center labels
	/*categoryDivs.push({'pos':totalWidth});
	console.log(categoryDivs);
	normalizedDivs = [];
	for (var i = 0; i < categoryDivs.length-1; i++) {
		newx = (categoryDivs[i].pos + categoryDivs[i+1].pos) / 2;
		normalizedDivs.push({'name':categoryDivs[i].name, 'pos':newx});
	}
	console.log(normalizedDivs);
	root.selectAll("g#catLabels").data(categoryDivs).enter()
		.append("text")
		.attr('x', function(d) { return d.pos; })
		.attr('y', padding/2)
		.attr('fill', "#0f0")
		.attr('transform', function(d) { return 'rotate(-80,'+ d.pos+', '+(padding+initHeight)+')'; })
		.text(function(d) { return d.name })
		;
	*/
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