const ctx = {
    WIDTH: 860,
    HEIGHT: 800,
    mapMode: false,
};

const ALBERS_PROJ = d3.geoAlbersUsa().translate([ctx.WIDTH/2, ctx.HEIGHT/2]).scale([1000]);

// https://github.com/d3/d3-force
const simulation = d3.forceSimulation()
                   .force("link", d3.forceLink()
                                    .id(function(d) { return d.id; })
                                    .distance(5).strength(0.08))
                   .force("charge", d3.forceManyBody())
                   .force("center", d3.forceCenter(ctx.WIDTH / 2, ctx.HEIGHT / 2));

function simStep(){
    d3.selectAll("#routeG path").attr("d", (d) => {
        const controlPoint = calculateControlPoint(d.source, d.target);
        return `M${d.source.x},${d.source.y} Q${controlPoint.x_cp},${controlPoint.y_cp} ${d.target.x},${d.target.y}`;
    });

    d3.selectAll("#airportG circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);  
}

function createGraphLayout(){
    let svgEL = d3.select("#main svg");
    // append the us_map
    let us_map = svgEL.append("g").attr("id", "us_map").attr("opacity", 0);
    let genpath = d3.geoPath().projection(ALBERS_PROJ);
    us_map.selectAll("path")
            .data(ctx.statesData.features)
            .enter()
            .append("path")
            .attr("d", genpath)
            .attr("class", "state");

    
    let routeG = svgEL.append("g").attr("id", "routeG");
    let airportG = svgEL.append("g").attr("id", "airportG");

    // scale color
    let degreeExtent = d3.extent(ctx.airport_vertices, d => d.degree);
    let degreeLogScale = d3.scaleLog().domain(degreeExtent).range([0, 1]);
    let color = d3.scaleSequential(d => d3.interpolateViridis(degreeLogScale(d)));
    //console.log(color(10));
    // var lines = ...;
    var lines = routeG.selectAll("path")
                    .data(ctx.route_edges)
                    .enter()
                    .append("path")
                    .style("opacity", 0.2);
    // var circles = ...;
    var circles = airportG.selectAll("circle")
        .data(ctx.airport_vertices)
        .enter()
        .append("circle")
        .attr("r", 5)
        .style("fill", d => color(d.degree));

    // add text to the circles
    circles.append("title")
            .text(d => d.city + " (" + d.id +")");
    

    circles.call(d3.drag().on("start", (event, d) => startDragging(event, d))
                          .on("drag", (event, d) => dragging(event, d))
                          .on("end", (event, d) => endDragging(event, d)));

    simulation.nodes(ctx.airport_vertices).on("tick", simStep);
    simulation.force("link").links(ctx.route_edges);
};


function switchVis(showMap){
    simulation.stop();
    if (showMap) {
        d3.selectAll("#us_map").transition().duration(600).attr("opacity", 1);
        
        d3.selectAll("#airportG circle")
            .transition()
            .duration(600)
            .attr("cx", d => d.projX)
            .attr("cy", d => d.projY);
        
        d3.selectAll("#routeG path")
            .transition()
            .duration(600)
            .attr("opacity", 0)
            .end()
            .then(() => {
                d3.selectAll("#routeG path")
                    .attr("d", (d) => {
                        const controlPoint = {
                            x_cp: (d.source.projX + d.target.projX) / 2,
                            y_cp: (d.source.projY + d.target.projY) / 2,
                        };
                        return `M${d.source.projX},${d.source.projY} Q${controlPoint.x_cp},${controlPoint.y_cp} ${d.target.projX},${d.target.projY}`;
                    })
                    .attr("opacity", 0.2);
            });
    } else {
        d3.selectAll("#us_map").transition().duration(600).attr("opacity", 0);

        d3.selectAll("#airportG circle").transition().duration(600)
            .attr("r", 5)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y);

        d3.selectAll("#routeG path")
            .transition()
            .duration(600)
            .attr("opacity", 0)
            .end()
            .then(() => {
                d3.selectAll("#routeG path")
                    .attr("d", (d) => {
                        const controlPoint = calculateControlPoint(d.source, d.target);
                        return `M${d.source.x},${d.source.y} Q${controlPoint.x_cp},${controlPoint.y_cp} ${d.target.x},${d.target.y}`;
                    })
                    .attr("opacity", 0.2);
            });

        setTimeout(function() {
            simulation.alphaTarget(0.3).restart();
        }, 600);

        simulation.nodes(ctx.airport_vertices).on("tick", simStep);
        simulation.force("link").links(ctx.route_edges);
    }
};


function calculateControlPoint(source, target){
    let rho = Math.sqrt((target.x - source.x)**2 + (target.y - source.y)**2)/(2*Math.cos(Math.PI /6));
    let alpha = Math.atan2(target.y - source.y, target.x - source.x);
    let x_cp = source.x + rho * Math.cos(alpha + Math.PI/6);
    let y_cp = source.y + rho * Math.sin(alpha + Math.PI/6);
    return { x_cp, y_cp}
}


function createViz(){
    console.log("Using D3 v" + d3.version);
    d3.select("body")
      .on("keydown", function(event, d){handleKeyEvent(event);});
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.WIDTH);
    svgEl.attr("height", ctx.HEIGHT);
    loadData();
};

function loadData(){
    // ...
    datas = ['data/airports.json', 'data/flights.json', 'data/us-states.geojson'];
    let promises = datas.map(url => fetch(url).then(response => response.json()));
    Promise.all(promises).then(results => {
        let airportsData = results[0];
        let flightsData = results[1];
        let statesData = results[2];
        // console.log(airportsData);
        // console.log(flightsData);
        // console.log(statesData);

        // Parse Airports Data into Vertices
        let airport_vertices = airportsData.map(airportdata => ({
            id: airportdata.iata,             
            group: airportdata.country,      
            state: airportdata.state,         
            city: airportdata.city,
            latitude: airportdata.latitude,
            longitude: airportdata.longitude            
        }));
        // Parse Flights Data into Edges
        let route_edges = flightsData.map(flightdata => ({
            source: flightdata.origin,        
            target: flightdata.destination,   
            value: flightdata.count           
        }));

        // Filter the data
        airport_vertices = airport_vertices.filter(d => !d.id.match(/^\d/));
        route_edges = route_edges.filter(d => d.value >= 2600);
        //Keep only airports that have connections
        const connectedAirports = new Set(route_edges.flatMap(d => [d.source, d.target]));
        airport_vertices = airport_vertices.filter(d => connectedAirports.has(d.id));

        // Compute Degree Centrality for Each Airport
        const degreeCentrality = {};
        route_edges.forEach(edge => {
            degreeCentrality[edge.source] = (degreeCentrality[edge.source] || 0) + 1;
            degreeCentrality[edge.target] = (degreeCentrality[edge.target] || 0) + 1;
        });


        // Attach the degree centrality to each airport vertex
        airport_vertices.forEach(airport => {
            airport.degree = degreeCentrality[airport.id] || 0;  
        });
        // Projection Coordinates for Geographical Data
        airport_vertices.forEach(d => {
            const coords = ALBERS_PROJ([d.longitude, d.latitude]);
            if (coords) {
                d.projX = coords[0];
                d.projY = coords[1];
            } else if (d.id === "SJU") { 
                d.projX = ctx.WIDTH - 20; 
                d.projY = ctx.HEIGHT - 20;
            }
        });

        ctx.airport_vertices = airport_vertices; 
        ctx.route_edges = route_edges;           
        ctx.statesData = statesData; 
        createGraphLayout();

    }).catch(error => console.log(error));
        

};

function startDragging(event, node){
    if (ctx.mapMode){return;}
    if (!event.active){
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragging(event, node){
    if (ctx.mapMode){return;}
    node.fx = event.x;
    node.fy = event.y;
}

function endDragging(event, node){
    if (ctx.mapMode){return;}
    if (!event.active){
        simulation.alphaTarget(0);
    }
    // commenting the following lines out will keep the
    // dragged node at its current location, permanently
    // unless moved again manually
    node.fx = null;
    node.fy = null;
}

function handleKeyEvent(e){
    if (e.keyCode === 84){
        // hit T
        toggleMap();
    }
};

function toggleMap(){
    ctx.mapMode = !ctx.mapMode;
    switchVis(ctx.mapMode);
};
