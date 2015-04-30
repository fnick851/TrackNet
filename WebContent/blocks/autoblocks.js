// display variables
var width=3;		// width of each block
var height=17; 		// active_category div height
var padding=16; 	// pixels between rows
var initheight=40; 	// search form height
var offset=5; 		// left margin for labels
var trackedColor = 0.75;
var cookieColor = 0.6;
var untrackedColor = 1.0;
var colors = d3.scale.category10();

// global vars
var selectedBlock = null;
var td;
var firstparty, thirdparty;
var categories;
var x;
var active_categories;
var other_categories;

function websiteView() {
	d3.select("#webview").attr("class", "selected");
	d3.select("#categoryview").attr("class", "");
	firstparty = firstparty.sort(function(a,b) { return d3.ascending(a.domain, b.domain);});
	loadData();
}

function categoryView() {
	d3.select("#webview").attr("class", "");
	d3.select("#categoryview").attr("class", "selected");
	firstparty = firstparty.sort(function(a,b) { return d3.ascending(a.category+a.domain,b.category+b.domain);});
	loadData();
}

function runMain() {
	d3.json("domainCategoryDict.json", function(error, json) {
		if (error) return alert("Error loading categories: " + error);
		categories = json;
		
		d3.json("257.data.json", function(error, json) {
		if (error) return alert("Error loading data: " + error);
			td = json;
			initializeCategories();
			initializeSearchBox();
			visualizeit();		  
		});
	});
}

var onMouseOverFirstParty = function() {
	var block = d3.select(this);
	var oldFill = block.attr("fill");
	block.attr("oldFill", oldFill);
	block.transition().duration(500).attr('fill', '#f00');
	
	var details = d3.select("#details");
	details.text(block.domain);
}

var onMouseOutFirstParty = function() {
	var block = d3.select(this);
	var oldFill = block.attr("oldFill");
	block.transition().duration(500).attr('fill', oldFill);
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
	
	for (var key in firstparty) {
		if (clist[firstparty[key].category] == null)
			clist[firstparty[key].category] = 1;
		else
			clist[firstparty[key].category]++;
	}
	
	// convert into tuples to sort descending by count
	var tuples = [];
	for (var key in clist)
		tuples.push([key, clist[key]]);

	tuples.sort(function(a, b) {
		a = a[1];
		b = b[1];
		return a < b ? 1 : (a > b ? -1 : 0);
	});

	for (var i = 0; i < tuples.length; i++) {
		var key = tuples[i][0];
		var value = tuples[i][1];
		
		if (i < 5) { // top N categories display by default
			active_categories.push({value:key, data:value, enabled:false});
		} else {
			other_categories.push({value:key, data:value, enabled:false});
		}
	}
}

function initializeSearchBox() {
	// set up search box
	for(var i = 0; i < active_categories.length; i++)
	{
		var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);">&times;</button>' +
			'<span class="item_name">' + active_categories[i].value + '</span> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + active_categories[i].data + '</span></i>' +
			//'<input type="checkbox">' +
			'<button class="move_up" onclick="moveUp(this);">&uparrow;</button>' +
			'<button class="move_down" onclick="moveDown(this);">&downarrow;</button>' +
			'</div>';

		$('#active_categories').append(html);
	}
	
	// setup autocomplete function pulling from categories[] array
	$('#autocomplete').autocomplete({
		minLength: 0,
		lookup: other_categories,
		onSelect: function (item) {
			var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);">&times;</button>' +
			'<span class="item_name">' + item.value + '</span> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + item.data + '</span></i>' +
			'<button class="move_up" onclick="moveUp(this);">&uparrow;</button>' +
			'<button class="move_down" onclick="moveDown(this);">&downarrow;</button>' +
			//'<input type="checkbox">' +
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
			loadData();
		}
    });
}

function getCategoryList(datalist) {
	cats = [];
	for (i=0;i<active_categories.length;i++){
		cats.push(active_categories[i]["value"]);
	}
	return cats;
}

function getHeightForCat(step, category, categoryList) {
	h = initheight-step+padding;
	for (i=0;i<categoryList.length;i++) {
		if (categoryList[i] == category)
			break;
		h += step + padding;
	}
	return h;
}

function visualizeit() {
	firstparty = td["first_party"];
	thirdparty = td["third_party"];
	firstparty = addCategoriesToJson(firstparty);
	
	// default to sort by domain
	firstparty = firstparty.sort(function(a,b) { return d3.ascending(a.domain, b.domain);});
	loadData();
}

function loadData() {
	categoryList = getCategoryList(firstparty);
	
	d3.select("#chart").select("svg").remove();
	var root = d3.select("#chart").append('svg')
		.attr('width', width*firstparty.length+offset)
		.attr('height', initheight+padding+(height+padding)*categoryList.length);
	
	// reset
	x = offset;
	root.selectAll("g").data(firstparty).enter()
		.append("g")
		.on("mouseover", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 0.5);
				var details = d3.select("#details");
				details.selectAll('p').remove();
				details.append('p')
					.text(block.data()[0].domain)
					.attr("class", "domain");
				details.append('p')
					.text(block.data()[0].category)
					.attr("class", "category");
			})
		.on("mouseout", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 1.0);
				
				if (selectedBlock != null) {
					var details = d3.select("#details");
					details.selectAll('p').remove();
					details.append('p')
						.text(block.data()[0].domain)
						.attr("class", "domain");
					details.append('p')
						.text(block.data()[0].category)
						.attr("class", "category");
				}
			})
		.on("click", function() {
				if (selectedBlock != null) {
					selectedBlock[0][0].removeChild(selectedBlock[0][0].childNodes[2]);
				}
				
				selectedBlock = d3.select(this);
				var totalHeight = height*categoryList.length;
				
				selectedBlock.append("rect")
				.attr('x', selectedBlock[0][0].childNodes[0].getAttribute("x"))
				.attr('y', padding)
				.attr('width', width)
				.attr('height', height + parseInt(selectedBlock[0][0].childNodes[1].getAttribute("y")) - padding)
				.attr('fill', '#ff0')
				.attr('opacity', 0.5);
			})
		.append("rect")
		.attr('x', function(d) {x += width; return x;})
		.attr('y', padding)
		.attr('width', width)
		.attr('height', initheight)
		.attr('fill', function(d) { return colors(d.category); })
		.attr('opacity', function(d) {
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; });
	
	// add individual blocks per category
	x = offset;
	y = height+width;
	root.selectAll("g")
		.append("rect")
		.attr('x', function(d) { x += width; return x; })
		.attr('y', function(d) { return y + padding + getHeightForCat(height, d.category, categoryList); }) // todo or sort by domain
		.attr('width', width)
		.attr('height', height)
		.attr('fill', function(d) { return colors(d.category); })
		.attr('opacity', function(d) {
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; })
		;
	
	// add labels
	/*
	root.selectAll("g")
		.append("text")
		.attr('x', 0)
		.attr('y', function(d) { return height*2 + getHeightForCat(height, d.category, categoryList); }) // todo or sort by domain
		.attr('font-family', 'Verdana')
		.attr('font-size', (height*0.75)+"px")
		.attr('fill', function(d) { return colors(d.category); })
		.text(function(d) { return d.category; })
		;
	*/
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
			loadData();
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
			loadData();
			return;
        }
    }
}