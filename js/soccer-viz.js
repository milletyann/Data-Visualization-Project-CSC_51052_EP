// Global configuration object
const config = {
    headerHeight: 100, updateInterval: 50, // milliseconds between frame updates
    teams: {
        home: {
            name: "Liverpool",
            score: 2,
            logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/5/54/Logo_FC_Liverpool.svg/langfr-130px-Logo_FC_Liverpool.svg.png"
        }, away: {
            name: "Fulham",
            score: 0,
            logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
        }
    }
};


// D3 scales for converting between meters and pixels
const scales = {
    x: d3.scaleLinear()
        .domain([0, 100]) // field dimensions in meters
        .range([0, 105]),  // field dimensions in pixels
    y: d3.scaleLinear()
        .domain([0, 100])
        .range([0, 68])
};

// Main visualization class
class SoccerVisualization {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.data = null;
        this.currentFrame = -1;
        this.animationInterval = null;
    }

    async initialize() {
        await this.loadData();

        this.createViz();

        this.startAnimation();
    }

    async loadData() {
        try {
            // Loading the CSV file
            this.data = await d3.csv('data/liverpool_2019.csv');
            // Filtering for specific match
            this.data = this.data.filter(d => d.play == "Liverpool [2] - 0 Man City");
            this.maxFrame = d3.max(this.data, d => parseInt(d.frame));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    createViz() {
        const pitch = custom_d3_soccer.pitch()
        const pitchWidth = pitch.width();
        const totalHeight = config.headerHeight + pitch.height();

        // Creating main SVG
        this.svg = this.container.append('svg')
            .attr('width', pitchWidth)
            .attr('height', totalHeight);

        // Adding header
        this.createHeader(pitchWidth);

        // Adding pitch
        this.createPitch(pitch);

        // Creating layers for players and Voronoi
        this.plotLayer = this.svg.select("#above");
        this.voronoiLayer = this.svg.select("#below");
    }

    createHeader(pitchWidth) {
        const header = custom_d3_soccer.matchHeader()
            .hed("Premier League")
            .score([config.teams.home.score, config.teams.away.score])
            .logoHome(config.teams.home.logo)
            .logoAway(config.teams.away.logo);

        const headerGroup = this.svg.append('g')
            .attr("transform", `translate(${pitchWidth / 3 - 11}, 20)`)
            .call(header);

        headerGroup.selectAll("image")
            .attr("height", 35);
    }

    createPitch(pitch) {
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

    updateFrame(frame) {
        const frameData = this.data.filter(d => d.frame == frame);

        // Updating player positions
        this.updatePlayers(frameData);

        // Updating Voronoi diagram
        this.updateVoronoi(frameData);
    }

    updatePlayers(frameData) {
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

        players.exit().remove(); // Removing players that are no longer in the frame
    }

    updateVoronoi(frameData) {
        const voronoiData = frameData.filter(d => parseInt(d.player));
        const delaunay = d3.Delaunay.from(voronoiData, d => scales.x(parseFloat(d.x)), d => scales.y(parseFloat(d.y)));
        const voronoi = delaunay.voronoi([0, 0, 105, 68]); // Bounding box for Voronoi diagram

        const cells = this.voronoiLayer.selectAll('path')
            .data(voronoiData.map((d, i) => voronoi.renderCell(i)));

        cells.enter()
            .append('path')
            .merge(cells)
            .attr('d', d => d)
            .style('fill', (_, i) => voronoiData[i].bgcolor)
            .style('opacity', 0.1)
            .style('stroke', 'black')
            .attr('stroke-width', .2);

        cells.exit().remove(); // Removing cells that are no longer in the frame
    }

    startAnimation() {
        this.animationInterval = setInterval(() => {
            this.currentFrame = this.currentFrame === this.maxFrame ? 0 : this.currentFrame + 1;
            this.updateFrame(this.currentFrame);
        }, config.updateInterval);
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }
}

function main() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    try {
        // Initializing visualization
        const viz = new SoccerVisualization('#visualization');
        viz.initialize().then(() => {
            loadingDiv.style.display = 'none'; // Hiding loading indicator

            // Setting up controls
            const playPauseBtn = document.getElementById('playPause');
            const resetBtn = document.getElementById('reset');

            let isPlaying = true;

            playPauseBtn.addEventListener('click', () => {
                if (isPlaying) {
                    viz.stopAnimation();
                    playPauseBtn.textContent = 'Play';
                } else {
                    viz.startAnimation();
                    playPauseBtn.textContent = 'Pause';
                }
                isPlaying = !isPlaying;
            });

            resetBtn.addEventListener('click', () => {
                viz.currentFrame = 0;
                viz.updateFrame(0); // Resetting to the first frame
            });
        });
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error loading visualization: ' + error.message;
    }
}