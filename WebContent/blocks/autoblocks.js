// note: need --allow-file-access-from-files to run in chrome from file
var td;
var categories;
var width=3;
var height=17; // active_category div height
var padding=16; // pixels between rows
var initheight=40; // search form height
var offset=5; // left margin for labels
var x=offset;
var trackedColor = 0.75;
var cookieColor = 0.6;
var untrackedColor = 1.0;
var firstparty, thirdparty;

var colors = d3.scale.category10();
var selectedBlock = null;

var active_categories;
var other_categories;

function runMain() {
	// todo: occasionally categories don't load until after the data which causes problems
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
	// todo switch to datalist so we get only categories for this data set
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
			'<button class="delete_item" onclick="remove_active_item(this);"></button>' +
			'<span class="item_name">' + active_categories[i].value + '</span> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + active_categories[i].data + '</span></i>' +
			'<input type="checkbox">' +
			'</div>';

		$('#active_categories').append(html);
	}
	
	// setup autocomplete function pulling from categories[] array
	$('#autocomplete').autocomplete({
		minLength: 0,
		lookup: other_categories,
		onSelect: function (item) {
			var html = '<div class="active_category_item">' +
			'<button class="delete_item" onclick="remove_active_item(this);"></button>' +
			'<span class="item_name">' + item.value + '</span> <span class="separator">|</span> ' +
			'<i><span class="item_percent">' + item.data + '</span></i>' +
			'<input type="checkbox">' +
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
	//initializeCategories();
	
	// todo: control sort type with buttons
	// sort by category (and by domain within)
	//firstparty = firstparty.sort(function(a,b) { return d3.ascending(a.category+a.domain,b.category+b.domain);});
	// sort by domain
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
				details.text(block.data()[0].domain);
				details.append('p').text(block.data()[0].category);
			})
		.on("mouseout", function() {
				var block = d3.select(this);
				block.transition().duration(10).attr('opacity', 1.0);
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
		.attr('y', function(d) { return y +padding/4+ getHeightForCat(height, d.category, categoryList); }) // todo or sort by domain
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

function pop_to_top(category_item)
{
    
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

