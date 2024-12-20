// Creating main SVG
this.svg = this.container.append('svg')
    .attr('width', pitchWidth)
    .attr('height', totalHeight);

// You need to change the translation of the pitchGroup to plot the pitch
// at the correct position
function createPitch(pitch) {
    const pitchGroup = this.svg.append('g')
        .attr("transform", `translate(0, ${config.headerHeight})`)
        .call(pitch);

    // Adding pitch background
    pitchGroup.append('rect')
        .attr('width', pitch.width())
        .attr('height', pitch.height())
        .attr('fill', 'darkgreen')
        .lower();
}

this.plotLayer = this.svg.select("#above");

function display_lineups(lineUpData) {
    const players = this.plotLayer.selectAll('circle')
        .data(frameData, d => parseInt(d.player) || 0);

    players.enter()
        .append('circle')
        .merge(players)
        .attr('cx', d => scales.x(parseFloat(d.x)))
        .attr('cy', d => scales.y(parseFloat(d.y)))
        .attr('r', 1)
        .attr('fill', d => d.bgcolor || 'black')
        .attr('stroke', d => d.edgecolor)
        .attr('stroke-width', .2)
        .attr('fill-opacity', 0.5);

    players.exit().remove();
}