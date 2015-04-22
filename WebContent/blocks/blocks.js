function runMain2() {
d3.select("#chart").text("");
var root = d3.select("#chart").append('svg')
    .attr('width', 200)
    .attr('height', 200)
    .style('border', '1px solid black');

root.selectAll('rect')
    .data([5, 25, 80]).enter()
  .append('rect')
    .attr('x', Object)
    .attr('y', Object)
    .attr('width', 15)
    .attr('height', 10)
    .attr('fill', '#c63')
    .attr('stroke', 'black');
}

// need --allow-file-access-from-files to run in chrome
var td;
function runMain() {
	d3.json("257wCats.json", function(error, json) {
	  if (error) return alert(error);
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

var width=5;
var x=-width;
var category = 0;
var categoryColors = ["#77f", "#7f7"];
function visualizeit() {
	//still to do: display third-party below corresponding first-party sites
	var thirdparty = td["third_party"];
	var firstparty = td["first_party"];
	
	
	d3.select("#chart").text("");
	var root = d3.select("#chart").append('svg')
		.attr('width', width*firstparty.length)
		.attr('height', 200)
		.style('border', '1px solid black');
	
	root.selectAll("rect").data(firstparty).enter()
		.append("rect")
		.attr('x', function(d) {x += width; return x;})
		.attr('y', 0)
		.attr('width', width)
		.attr('height', 20)
		.attr('category', function(d) {
				category = 1 - category;
				return category;
			})
		.attr('fill', function(d) {
				return categoryColors[d.category];
			})
		//.attr('stroke', 'black')
		.on("mouseover", function() {
				var block = d3.select(this);
				
				//var oldFill = block.attr("fill");
				//block.attr("oldFill", oldFill);
				//alert(Object.getOwnPropertyNames(block.data()[0]));
				
				block.transition().duration(500).attr('fill', '#f00');
				var details = d3.select("#details");
				details.text(block.data()[0].domain);
			})
		.on("mouseout", function() {
				var block = d3.select(this);
				block.transition().duration(500).attr('fill', categoryColors[block.data()[0].category]);
			})
		.append("svg:title")
		.text(function(d) { return d.domain; });
}
