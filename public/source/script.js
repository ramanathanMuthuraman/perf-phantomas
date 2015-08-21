"use strict";

function generateChart(fileType, el) {



  var width = 1000, height=600;
  var sizeCharacterLength = 8;
  var fontSizeInPixels = 4;
  var lineHeight = 20;
  var color = d3.scale.category20c();
   var convertToMB = 0;
   var requests = 0;
   var children = [];
  for (var j = 0; j < fileType.length; j++) {
     convertToMB += fileType[j].value / 1000000;
      if(fileType[j].files){
       requests +=  fileType[j].files.length;
       children.push(fileType[j]);
     }
  }
  generateHeader(convertToMB.toFixed(2) +" MB Transferred in "+requests+" requests", el);

    var json = {
      "children" : children
    };



    var bubble = d3.layout.pack()
    .sort(null)
    .size([width, height]);

    var svg = d3.select(el)
    .append("div")
    .attr("class", "bubble-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "bubble");


 var node = svg.selectAll(".node")
      .data(bubble.nodes(json).filter(function(d) { return !d.children; }))
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

       node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill",  function(d) { return color(d.title); });

       node.append("text")
       .attr("color","#000")
       .attr("x", function(d) {
          return -fontSizeInPixels*(d.title.length);
        })
      .text(function(d) {return d.title;});

      node.append("text")
       .attr("color","#000")
       .attr("x", function(d) {
          return -fontSizeInPixels*sizeCharacterLength;
        })
       .attr("y", function(d) {
          return lineHeight;
        })
      .text(function(d) {return " (" + (d.value / 1000000).toFixed(2) + " MB)";});

        var tooltip = d3.select(el)
        .append("div")
        .attr("class", "tooltip");

        tooltip.append("span")
        .attr("class", "label title");

        tooltip.append("span")
        .attr("class", "count title");

        tooltip.append("div")
        .attr("class", "percent");



        node.on("mousemove", function(d) {

              tooltip.select(".label")
                .html(d.title);
              tooltip.select(".count")
                .html(" (" + (d.value / 1000000)
                  .toFixed(2) + " MB transferred in "+d.files.length+" request(s))");
              tooltip.select(".percent")
                .html("<pre>" + d.files.join("\n") + "</pre>");
              tooltip.style("display", "block");
              tooltip.style("top", d3.event.pageY + 45);
              tooltip.style("left", d3.event.pageX - 16 - Math.floor(tooltip[0][0].getBoundingClientRect()
                .width * 0.5));

        });

        node.on("mouseout", function(e) {

              tooltip.style("display", "none");


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
    });
}

function generateResourceTiming(filename, el) {
  generateHeader("Resource Panel", el);
  d3.select(el)
    .append("iframe")
    .attr("class", "resourceTiming")
    .attr("src", filename + ".html");

}

function fetchData() {
  d3.json("perfomanceData.json", function(err, pages) {

    if (err) {
      return console.warn(err);
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
      generateChart(pages[i].fileType, chart[0][0]);
      generateResourceTiming(pages[i].title, resourcePanel[0][0]);

    }
    generateNavigation();
  });

}

function generateNavigation() {
  var height = d3.select('.section')[0][0].clientHeight;
  d3.select("#container")
    .append("div")
    .attr("class", "nav");
  var nav = d3.select(".nav")
  nav.append("div")
    .attr("class", "prev");
  nav.append("div")
    .attr("class", "current center")
    .html("0");
  nav.append("div")
    .attr("class", "next");

  d3.select(".next")
    .on("click", function() {

     d3.transition()
    .duration(1000)
    .tween("scroll", scrollTween(window.scrollY+height));

    });

  d3.select(".prev")
    .on("click", function() {

       d3.transition()
    .duration(1000)
    .tween("scroll", scrollTween(window.scrollY-height));

    });

}

function scrollTween(offset){
return function() {
    var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
    return function(t) { scrollTo(0, i(t)); };
  };
}


fetchData();
