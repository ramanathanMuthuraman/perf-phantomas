"use strict";

function generateChart(fileType, chart) {

  var width = 450;
  var height = 450;
  var radius = Math.min(width, height) / 2;
  var colour = d3.scale.category20();
  var legendRectSize = 18;
  var legendSpacing = 4;
  var svg = d3.select(chart)
    .append("div")
    .attr("class", "pie-chart right")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

  svg.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 100)
    .attr("fill", "#FFFFFF");

  // Determine size of arcs
  var arc = d3.svg.arc()
    .innerRadius(radius - 50)
    .outerRadius(radius - 10);

  // Create the donut pie chart layout
  var pie = d3.layout.pie()
    .value(function(d) {
      return d.size;
    });

  var tooltip = d3.select(chart)
    .append("div")
    .attr("class", "tooltip");

  tooltip.append("span")
    .attr("class", "label");

  tooltip.append("span")
    .attr("class", "count");

  tooltip.append("div")
    .attr("class", "percent");

  var path = svg.selectAll("path")
    .data(pie(fileType))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", function(d) {
      return colour(d.data.title);
    });

  path.on("mousemove", function(d) {

    tooltip.select(".label")
      .html(d.data.title);
    tooltip.select(".count")
      .html(" (" + (d.data.size / 1000000)
        .toFixed(2) + " MB)");
    tooltip.select(".percent")
      .html("<pre>" + d.data.files.join("\n") + "</pre>");
    tooltip.style("display", "block");
    tooltip.style("top", d3.event.pageY + 45);
    tooltip.style("left", d3.event.pageX - 16 - Math.floor(tooltip[0][0].getBoundingClientRect()
      .width * 0.5));

  });

  path.on("mouseout", function() {
    tooltip.style("display", "none");

  });

  var legend = svg.selectAll(".legend")
    .data(colour.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      var height = legendRectSize + legendSpacing;
      var offset = height * colour.domain()
        .length / 2;
      var horz = -2 * legendRectSize;
      var vert = i * height - offset;
      return "translate(" + horz + "," + vert + ")";
    });

  legend.append("rect")
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .style("fill", colour)
    .style("stroke", colour);

  legend.append("text")
    .attr("x", legendRectSize + legendSpacing)
    .attr("y", legendRectSize - legendSpacing)
    .text(function(d) {
      return d;
    });
}

function generateHeader(filename, el) {

  d3.select(el)
    .append("h1")
    .attr("class", "title center section-header")
    .html(filename);

}

function generateScreenshot(filename, el) {

  generateHeader(filename + "-Statistics", el);
  d3.select(el)
    .append("div")
    .attr("class", "screenshot right")
    .append("img")
    .attr("src", filename + ".jpg")
    .attr("class");

}

function generateStats(stats, el) {

  var html = "";
  for (var j = 0; j < stats.length; j++) {
    var info = stats[j].info;
    if (info instanceof Array) {
      info = info.join("\n");
    }

    html += "<div class='metrics left'>";
    html += "<p class='title left'>" + stats[j].title + "</p>";
    html += "<p class='title right'>" + stats[j].time + " " + stats[j].units + "</p>";
    html += "<p class='clear center'><code title='" + info + "' class='break'>" + info + "</code>";
    html += "</div>";
  }
  d3.select(el)
    .append("div")
    .attr("class", "dashboard left")
    .html(html);

}

function generateTable(fileType, el) {

  generateHeader("Asset Types", el);
  var html = "";
  var total = 0;
  html += "<div class='time-stats left'>";
  for (var j = 0; j < fileType.length; j++) {
    var convertToMB = (fileType[j].size / 1000000)
      .toFixed(2);
    total += parseFloat(convertToMB);
    html += "<div data-filetype=" + fileType[j].title.toLowerCase() + " class='fileType metrics'>";
    html += "<p class='title center'>" + fileType[j].title + "</p>";
    html += "<p class='center'>" + convertToMB + "</p>";
    html += "</div>";
  }
  html += "<div class='footer metrics'>";
  html += "<p class='title center'>Total</p>";
  html += "<p class='center'>" + total.toFixed(2) + "</p>";
  html += "</div>";
  html += "</div>";
  var table = d3.select(el)
    .append("div")
    .attr("class", "stats")
    .html(html);

  table.selectAll(".filetype")
    .on("mousemove", function() {
      var el = d3.select(this);
      el.classed(el.attr("data-filetype"), true);
    })
    .on("mouseout", function() {
      var el = d3.select(this);
      el.classed(el.attr("data-filetype"), false);
    });;
}

function generateResourceTiming(filename, el) {
  generateHeader("Resource Panel", el);
  d3.select(el)
    .append("iframe")
    .attr("class", "resourceTiming")
    .attr("src", filename + ".html");

}

function fetchData() {
  d3.json("perfomanceData.json", function(error, pages) {

    if (error) {
      return console.warn(error);
    }
    for (var i = 0; i < pages.length; i++) {
      d3.select("#container")
        .append("div")
        .attr("class", "page");
      var page = d3.selectAll(".page")[0][i];
      var stats = d3.select(page)
        .append("div")
        .attr("class", "section clear");
      var chart = d3.select(page)
        .append("div")
        .attr("class", "section clear");
      var resourcePanel = d3.select(page)
        .append("div")
        .attr("class", "section clear");
      generateScreenshot(pages[i].title, stats[0][0]);
      generateStats(pages[i].stats, stats[0][0]);
      generateTable(pages[i].fileType, chart[0][0]);
      generateChart(pages[i].fileType, chart[0][0]);
      generateResourceTiming(pages[i].title, resourcePanel[0][0]);

    }

  });

}

function generateNavigation() {
  var height = d3.select('body')[0][0].clientHeight;
  d3.select("#container")
    .append("div")
    .attr("class", "nav");
  var nav = d3.select(".nav")
  nav.append("div")
    .attr("class", "prev")
  nav.append("div")
    .attr("class", "current center")
    .html("0")
  nav.append("div")
    .attr("class", "next");

  d3.select(".next")
    .on("click", function() {

      window.scrollBy(0, height);

    });

  d3.select(".prev")
    .on("click", function() {

      window.scrollBy(0, -height);

    });

}

generateNavigation();
fetchData();