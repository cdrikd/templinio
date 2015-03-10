// Templinio : Timeline using d3js
// It's only a proof of concept
//

// Size of the timeline
var w = 500;
var h = 300;

var dataset = ["2015-02-16","2015-06-16","2015-04-02","2015-11-08","2015-08-25","2015-06-30",
    "2015-09-02"];

var tScale = d3.time.scale()
                    .domain([new Date("2015-01-01"), new Date("2015-12-31")])
                    .range([0,w]);

var format = d3.time.format("%Y-%m-%d");
var xAxis = d3.svg.axis()
  .scale(tScale)
  .tickFormat(format)
  .orient("bottom")
  .tickSize(-h);

var svg = d3.select("#templinio-example1")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var zoom = d3.behavior.zoom()
    .x(tScale)
    .scaleExtent([1, 5])
    .on("zoom", zoomed);

function transform(d) {
    return "translate("+tScale(new Date(d))+", "+50+")"
}

var newsvg = svg.append("g").call(zoom);

// Create a rectangle for all timeline to use mousse zoom
newsvg.append("rect")
    .attr("width", w)
    .attr("height", h);

newsvg.append("g")
    .attr("class", "x axis")
    .attr("transform","translate(0," + (h - 30) + ")")
    .call(xAxis);

var essai = newsvg.selectAll("circle").data(dataset).enter().append("circle")
        .attr("x", function(d){return tScale(d);})
                .attr("y", function(){ return Math.random() * 400;})
    .attr("transform", transform)
    .attr("r",5);

var txt = newsvg.selectAll("text").data(dataset).enter().append("text")
    .text(function(d) {return d;})
    .attr("x",function(d) { return tScale(new Date(d));})
    .attr("y",40)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", "red");

function zoomed(d) {
    svg.select(".x.axis").call(xAxis);
    essai.attr("transform", transform);
    console.log(tScale);
}

