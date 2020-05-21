
  // set the dimensions and margins of the graph
  
  var margin = {top: 30, right: 10, bottom: 0, left: 10},
  width = 1650 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;
 
  var x = d3.scaleLinear().range([0, width], 1),
  y = {},
  dragging = {};
  
  var line = d3.line(),
  axis = d3.axisLeft(),
  background,
  foreground;

  // append the svg object to the body of the page
  
  var svg = d3.select("#mioGrafico")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

        
  // Parse the Data

  d3.json("./dataset.json", function(data) {
    
 
  // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Countries
  x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
    if (d == "Name") {
      return;
    }
    if (d == "Infected") {
      // invert axis
      return (y[d] = d3.scaleLinear()
        .domain(d3.extent(data, function(p) { return +p[d]; }))
        .range([0, height]));
    }
    return (y[d] = d3.scaleLinear()
        .domain(d3.extent(data, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

  // For each dimension, I build a linear scale. I store all in a y object
  
    for (i in dimensions) {
      name = dimensions[i]
      y[name] = d3.scaleLinear()
        .domain( d3.extent(data, function(d) { return +d[name]; }) )
        .range([height, 0])
    }

   //Color scale: give me a specie name, I return a color
    
   var color = d3.scaleOrdinal()
    .domain(["Spain", "Italy", "United Kingdom", "France", "Germany", "Belgium", "Netherlands", "Georgia", "Switzerland", "Portugal" ])
    .range([ "#A93226", "#16A085", "#212F3C", "#F4D03F", "#030303", "#D5DBDB", "#D35400", "#D98880", "#ABEBC6", "#D2B4DE"])

 
  // Build the X scale -> it find the best position for each Y axis
  
  x = d3.scalePoint()
    .range([0, width], 1)
    .padding(1)
    .domain(dimensions);

     
    background = svg.append("g")
    .attr("class", "background")
    .selectAll("path")
    .data(data)
    .enter().append("svg:path")
    .attr("d", path);

    // Add color foreground lines for focus.
  foreground = svg.append("g")
  .attr("class", lines )
  .selectAll("myPath")
  .data(data)
  .enter().append("path")
  .attr("d", path)
  .style("fill", "none")
  .style("stroke", function(d){ return( color(d.Name))} )
  
  var lines = function(d) {
    return "line" + d.Name;
  }

  

  countries = [ "Spain", "Italy", "United Kingdom", "France", "Germany", "Belgium", "Netherlands", "Georgia", "Switzerland", "Portugal" ]
  
  
    // Add one dot in the legend for each name.
    svg.selectAll("mydots")
    .data(countries)
    .enter()
    .append("circle")
    .attr("cx", 100)
    .attr("cy", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("r", 7)
    .style("fill", function(d){ return color(d)})

    svg.selectAll("mylabels")
    .data(countries)
    .enter()
    .append("text")
    .attr("x", 120)
    .attr("y", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function(d){ return color(d)})
    .text(function(d){ return d})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")


    // Returns the path for a given data point.
    function path(d) {
      return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
    }

    var origDimensions = dimensions.slice(0);
 
     // Add a group element for each dimension.
     var g = svg.selectAll(".dimension")
     .data(dimensions)
    .enter().append("g")
    .attr("class", "dimension")
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    .call(d3.drag()
    .subject(function(d) {
     console.log(d);
     return {x: x(d)}; })
    .on("start", function(d) {
     dragging[d] = x(d);
     background.attr("visibility", "hidden");
   })
    .on("drag", function(d) {
     dragging[d] = Math.min(width, Math.max(0, d3.event.x));
     foreground.attr("d", path);
     dimensions.sort(function(a, b) { return position(a) - position(b); });
     x.domain(dimensions);
     g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
   })
    .on("end", function(d) {
     delete dragging[d];
     transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
     transition(foreground).attr("d", path);
     background.attr("d", path)
     .transition()
     .delay(500)
     .duration(0)
     .attr("visibility", null);
   }));

    // Add an axis and title.
    g.append("g")
    .attr("class", "axis")
    .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
    .style("text-anchor", "left")
    .attr("y", -9)
    .text(function(d) { return d});
    
      
     // Add and store a brush for each axis.
    g.append("g")
    .attr("class", "brush")
    .each(function(d) { d3.select(this).call(y[d].brush = d3.brushX(y[d]).on("brush", brush)); })
    .selectAll("rect")
    .attr("x", -8)
    .attr("width", 16);
  });

    function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

    function transition(g) {
    return g.transition().duration(500);
  }

    // Returns the path for a given data point.
    function path(d) {
    return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
  }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
    var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
    extents = actives.map(function(p) { return y[p].brush.extent(); });
    foreground.style("display", function(d) {
    return actives.every(function(p, i) {
    return extents[i][0] <= d[p] && d[p] <= extents[i][1];
  }) ? null : "none";
});
}


  


      
    