// display variables
var width=4;		// width of each block
var height=17; 		// active_category div height
var padding=16; 	// pixels between rows
var initHeight=40; 	// search form height
var offset=5; 		// left margin for labels
var trackedColor = 0.7; // opacity coding
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


var id_list;

function websiteSearch() {
	curSearch = 0;
	d3.select("#websearch").attr("class", "selected");
	d3.select("#categorysearch").attr("class", "");
	
	initializeCategories();
	initializeSearchBox();
	firstparty = addCategoriesToJson(firstparty);
	loadData();
}

function categorySearch() {
	curSearch = 1;
	d3.select("#categorysearch").attr("class", "selected");
	d3.select("#websearch").attr("class", "");
	
	initializeCategories();
	initializeSearchBox();
	firstparty = addCategoriesToJson(firstparty);
	loadData();
}

function websiteView() {
	curView = 0;
	d3.select("#webview").attr("class", "selected");
	d3.select("#categoryview").attr("class", "");
	firstparty = firstparty.sort(function(a,b) {
		var aTracking = isTracked(a.uid)?(hasCookie(a.uid)?"A":"B"):"C";
		var bTracking = isTracked(b.uid)?(hasCookie(b.uid)?"A":"B"):"C";
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
		var aTracking = isTracked(a.uid)?(hasCookie(a.uid)?"A":"B"):"C";
		var bTracking = isTracked(b.uid)?(hasCookie(b.uid)?"A":"B"):"C";
		return d3.ascending(a.category+a.domain+aTracking,
							b.category+b.domain+bTracking);
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
			initializeCategories();
			initializeSearchBox();
			
			firstparty = td["first_party"];
			thirdparty = td["third_party"];
			firstparty = addCategoriesToJson(firstparty);
			visualizeit();		  
		});
	});

	d3.json("851.ids.json", function(error, json) 
	{
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
		else if (thirdparty[i]['uid'] > domainId) // save on time, since they are ordered by uid
			return false;
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
		else if (thirdparty[i]['uid'] > domainId) // save on time, since they are ordered by uid
			return false;
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
	active_categories = [];
	other_categories = [];
	clist = {};
	
	firstparty = td["first_party"];
	firstparty = addCategoriesToJson(firstparty);
	
	thirdparty = td["third_party"];
	thirdparty = addCategoriesToJson(thirdparty);

	if (curSearch == 1) {
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
			if (curSearch == 1)
				active_categories.push({value:key, data:value, enabled:false, is_category: true});
			else
				active_categories.push({value:key, data:value, enabled:false, is_category: false});
		} else {
			if (curSearch == 1)
				other_categories.push({value:key, data:value, enabled:false, is_category: true});
			else
				other_categories.push({value:key, data:value, enabled:false, is_category: false});
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
	for(var i = 0; i < active_categories.length; i++)
	{
		var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);">&times;</button>';

			if(active_categories[i].is_category)
				html += '<a class="item_name iframe" href=' +'bubbles/popup.html?category='+ id_list["catDict"][active_categories[i].value] + '>'
			else
				html += '<a class="item_name iframe" class="iframe" href=' +'bubbles/popup.html?domain='+ id_list["domainDict"][active_categories[i].value] + '>';

			html += active_categories[i].value + '</a> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + active_categories[i].data + '</span></i>' +
			'<button class="move_up" onclick="moveUp(this);">&uparrow;</button>' +
			'<button class="move_down" onclick="moveDown(this);">&downarrow;</button>' +
			'</div>';

		$('#active_categories').append(html);
		
		unionTotal += active_categories[i].data;
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
		lookup: other_categories,
		onSelect: function (item) {
			var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);">&times;</button>';

			if(item.is_category)
				html += '<a class="item_name" class="iframe" href=' +'bubbles/popup.html?category='+ id_list["catDict"][item.value] + '>'
			else
				html += '<a class="item_name" class="iframe" href=' +'bubbles/popup.html?domain='+ id_list["domainDict"][item.value] + '>';

			html += item.value + '</a> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + item.data + '</span></i>' +
			'<button class="move_up" onclick="moveUp(this);">&uparrow;</button>' +
			'<button class="move_down" onclick="moveDown(this);">&downarrow;</button>' +
			'</div>';

			$('#active_categories').append(html);
			document.getElementById('autocomplete').value = '';

			for (var i = 0; i < other_categories.length; i++) {
				if (other_categories[i].value == item.value)
					other_categories.splice(i, 1);
			}

			active_categories.push(item);
			$(document).trigger('click');
			
			// update
			initializeSearchBox();
			loadData();
		}
    });

	$(".iframe").colorbox({iframe:true, width:"90%", height:"90%", closeButton: false});
}

function getCategoryList(datalist) {
	cats = [];
	for (i=0;i<active_categories.length;i++){
		cats.push(active_categories[i]["value"]);
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
// previously: store firstparty/thirdparty vars,add categories, sort
	if (curView == 0)
		websiteView();
	else
		categoryView();
}

function loadData() {
	categoryList = getCategoryList(firstparty);
	
	d3.select("#chart").select("svg").remove();
	var totalHeight = initHeight+padding+(height+padding)*(categoryList.length+1); // +1 for union row
	var root = d3.select("#chart").append('svg')
		.attr('width', width*firstparty.length+offset)
		.attr('height', totalHeight);
	
	// reset
	x = offset;
	xpos = {};
	root.selectAll("g").data(firstparty).enter()
		.append("g")
		.on("mouseover", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 0.5);
				var details = d3.select("#details");
				/*details.selectAll('p').remove();
				details.append('p')
					.append("a")
					.attr("href", "#")
					.text(block.data()[0].domain)
					.attr("class", "domain");
				details.append('p')
					.append("a")
					.attr("href", "#")
					.text(block.data()[0].category)
					.attr("class", "category");	*/

				$('#domain_link').html(block.data()[0].domain);
				$('#domain_link').attr('href', 'bubbles/popup.html?domain=' + id_list["domainDict"][block.data()[0].domain]);

				$('#category_link').html(block.data()[0].category);
				$('#category_link').attr('href', 'bubbles/popup.html?category=' + id_list["catDict"][block.data()[0].category]);
				
				var divx = parseInt(block.select("rect").attr("x")) - 50 - chart.scrollLeft; // div offset - 1/2 tooltip width
				details.transition()
					.duration(200)
					.style("opacity", .9)
					.style("left", divx + "px")
					.style("top", initHeight+height/2 + 50 +"px");
            })
		.on("mouseout", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 1.0);
				var details = d3.select("#details");
				/*details.selectAll('p').remove();*/
				/*details.transition()
					.duration(200)
					.style("opacity", 0);*/
				
				/*if (selectedBlock != null) {
					details.append('p')
						.text(selectedBlock.data()[0].domain)
						.attr("class", "domain");
					details.append('p')
						.text(selectedBlock.data()[0].category)
						.attr("class", "category");
				}*/
			})
		.on("click", function() {
				if (selectedBlock != null) {
					selectedBlock[0][0].removeChild(selectedBlock[0][0].childNodes[1]);

					/*$('#domain_link').html(selectedBlock.data()[0].domain);
					$('#domain_link').attr('href', 'bubbles/popup.html?domain=' + id_list["domainDict"][selectedBlock.data()[0].domain]);

					$('#category_link').html(selectedBlock.data()[0].category);
					$('#category_link').attr('href', 'bubbles/popup.html?category=' + id_list["catDict"][selectedBlock.data()[0].category]);*/
				}
				
				selectedBlock = d3.select(this);
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
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; })
		;
	
	// add 'union' row at bottom
	x = offset;
	y = height+width;
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
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; })
		;
}

function remove_active_item(remove_item)
{
    var item_value = $(remove_item).next().html();
    var item;
    $(remove_item).parent().remove();
    

    for (var i = 0; i < active_categories.length; i++) 
    {
        if (active_categories[i].value == item_value) 
        {
            item = active_categories[i];
            active_categories.splice(i, 1);
        }
    }

    other_categories.push(item);
	
	// update
	initializeSearchBox();
	loadData();
}

function moveUp(moveItem) {
    var item_value = $(moveItem).prev().prev().prev().html();
    
	for (var i = 1; i < active_categories.length; i++)  {
		if (active_categories[i].value == item_value)  {
			var item = active_categories[i];
			var prev = active_categories[i-1];
			active_categories[i-1] = item;
			active_categories[i] = prev;
			
			var itemDiv = $(moveItem).parent();
			itemDiv.prev().before(itemDiv);
			
			initializeSearchBox();
			return;
        }
    }
}

function moveDown(moveItem) {
    var item_value = $(moveItem).prev().prev().prev().prev().html();
    
	for (var i = 0; i < active_categories.length-1; i++)  {
		if (active_categories[i].value == item_value)  {
			var item = active_categories[i];
			var next = active_categories[i+1];
			active_categories[i+1] = item;
			active_categories[i] = next;
			
			var itemDiv = $(moveItem).parent();
			itemDiv.next().after(itemDiv);
			
			initializeSearchBox();
			return;
        }
    }
}

function hide_tooltip()
{

	var details = d3.select('#details');
	
	details.transition()
	.duration(200)
	.style("opacity", 0);

}