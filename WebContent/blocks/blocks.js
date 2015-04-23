// note: need --allow-file-access-from-files to run in chrome from file
var td;
var categories;
function runMain() {
	d3.json("domainCategoryDict.json", function(error, json) {
		if (error) return alert("Error loading categories: " + error);
		categories = json;
	});
	
	d3.json("visualization-data-anon-2/257.data.json", function(error, json) {
	  if (error) return alert("Error loading data: " + error);
	  td = json;
	  visualizeit();
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

function getCategoryList(datalist) {
	clist = {};
	for (i=0;i<datalist.length;i++) {
		clist[datalist[i].category] = 1;
	}
	clistKeys = [];
	for (var key in clist) {
		if (clist.hasOwnProperty(key))
			clistKeys.push(key);
	}
	return clistKeys;
}

function getHeightForCat(step, category, categoryList) {
	h = 0;
	for (i=0;i<categoryList.length;i++) {
		if (categoryList[i] == category)
			break;
		h += step;
	}
	return h;
}

var width=5;
var height=20;
var offset=150; // left margin for labels
var x=offset;
var trackedColor = "#CC5";
var cookieColor = "#C65";
var untrackedColor = "#6C5";
var unknownColor = "#56C";
function visualizeit() {
	var firstparty = td["first_party"];
	var thirdparty = td["third_party"];
	firstparty = addCategoriesToJson(firstparty);
	
	// todo: control sort type with buttons
	// sort by category (and by domain within)
	//firstparty = firstparty.sort(function(a,b) { return d3.ascending(a.category+a.domain,b.category+b.domain);});
	// sort by domain
	firstparty = firstparty.sort(function(a,b) { return d3.ascending(a.domain, b.domain);});
	categoryList = getCategoryList(firstparty);
	
	d3.select("#chart").text("");
	var root = d3.select("#chart").append('svg')
		.attr('width', width*firstparty.length+offset)
		.attr('height', height*categoryList.length);
	
	root.selectAll("g").data(firstparty).enter()
		.append("g")
		.on("mouseover", function() {
				var block = d3.select(this);
				block.transition().duration(100).attr('opacity', 0.5);
				var details = d3.select("#details");
				details.text(block.data()[0].domain);
				details.append('p').text(block.data()[0].category);
			})
		.on("mouseout", function() {
				var block = d3.select(this);
				block.transition().duration(100).attr('opacity', 1.0);
			})
		.append("rect")
		.attr('x', function(d) {x += width; return x;})
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height)
		.attr('fill', function(d) {
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		.append("svg:title")
		.text(function(d) { return d.domain; });
	
	// add shading bars underneath
	// commented out because this adds a bar per datum and that messes up the ordering of elements
	/*
	x = -width;
	y = height+width;
	row = 0;
	lastCat = '';
	root.selectAll("g")
		.append("rect")
		.attr('x', 0)
		.attr('y', function(d) { return y + getHeightForCat(height, d.category, categoryList); }) // todo or sort by domain
		.attr('width', width*firstparty.length)
		.attr('height', height)
		.attr('fill', function(d) {
				var h = getHeightForCat(height, d.category, categoryList);
				return (h/height%2==0)?"#FFF":"#CCC";
			})
		.attr('opacity', 0.1);
		;
	*/
	
	// add individual blocks per category
	x = offset;
	y = height+width;
	root.selectAll("g")
		.append("rect")
		.attr('x', function(d) { x += width; return x; })
		.attr('y', function(d) { return y + getHeightForCat(height, d.category, categoryList); }) // todo or sort by domain
		.attr('width', width)
		.attr('height', height)
		.attr('fill', function(d) {
				return (!isTracked(d.uid))?untrackedColor:(hasCookie(d.uid))?cookieColor:trackedColor;
			})
		;
	
	// add labels
	root.selectAll("g")
		.append("text")
		.attr('x', 0)
		.attr('y', function(d) { return height*2 + getHeightForCat(height, d.category, categoryList); }) // todo or sort by domain
		.attr('font-family', 'Verdana')
		.attr('font-size', (height*0.75)+"px")
		.text(function(d) { return d.category; })
		;
	// for reference
	/*x = -width;
	y = height*2;
	firstparty.forEach(function(d) {
		root.append("rect")
		.attr('x', function(d) { x += width; return x; })
		.attr('y', y)
		.attr('width', width)
		.attr('height', height)
		.attr('fill', unknownColor);
		});
	*/
}
