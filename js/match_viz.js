const matchConfigs = {} // Object to store match configurations
// Global configuration object
const config = {
    headerHeight: 100,
    updateInterval: 50, // milliseconds between frame updates
    teams: {
        home: {
            name: "",
            score: NaN,
            logo: ""
        },
        away: {
            name: "",
            score: NaN,
            logo: ""
        }
    }
};

let pitchHeight;

// D3 scales for converting between meters and pixels
const scales = {
    x: d3.scaleLinear()
        .domain([0, 100]) // field dimensions in meters
        .range([0, 105]),  // field dimensions in pixels
    y: d3.scaleLinear()
        .domain([0, 100])
        .range([68, 0])
};

// Main visualization class
class SoccerVisualization {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.data = null;
        this.currentFrame = -1;
        this.animationInterval = null;
        this.currentMatch = null;
    }

    async initialize(matchId) {
        // Stopping any existing animation
        this.stopAnimation();

        // Clearing existing visualization
        this.container.html('');

        // Setting current match
        this.currentMatch = matchConfigs[matchId];

        // Updating global config
        Object.assign(config.teams, this.currentMatch.config.teams);

        await this.loadData();

        this.createViz();

        this.currentFrame = -1;

        this.startAnimation();
    }

    async loadData() {
        try {
            // Loading the CSV file
            this.data = await d3.csv(`data/matches_to_visualize/${this.currentMatch.file}`);

            // Applying filter if exists
            if (this.currentMatch.filter) {
                this.data = this.data.filter(d => d.play === this.currentMatch.filter);
            }

            this.maxFrame = d3.max(this.data, d => parseInt(d.frame));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    createViz() {
        const pitch = custom_d3_soccer.pitch()
        const pitchWidth = pitch.width();
        pitchHeight = pitch.height();
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
            .hed("")
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

async function main() {
    const loadingDiv = document.getElementById('loading');
    const matchSelect = document.getElementById('matchSelect');
    let viz = null;

    // Initially showing loading indicator while we fetch matches
    loadingDiv.style.display = 'block';

    try {
        // Loading match configurations from JSON file
        const response = await fetch('data/matches_to_visualize/match_configs.json');
        const matchesData = await response.json();

        // Populating matchConfigs object with the loaded data
        Object.assign(matchConfigs, matchesData);

        // Clearing and populating the select element
        matchSelect.innerHTML = '<option value="">Select a match to visualize</option>';

        // Adding each match as an option
        Object.entries(matchesData).forEach(([matchId, matchData]) => {
            const competition = matchData.competition;
            const year = matchId.slice(-4);
            const homeTeam = matchData.config.teams.home;
            const awayTeam = matchData.config.teams.away;
            const option = document.createElement('option');
            option.value = matchId;
            option.textContent = `${competition} (${year}) - ${homeTeam.name} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.name}`;
            matchSelect.appendChild(option);
        });

        // Initially hiding loading indicator after matches are loaded
        loadingDiv.style.display = 'none';

        // Setting up match selection handler
        matchSelect.addEventListener('change', async (event) => {
            const selectedMatch = event.target.value;

            if (!selectedMatch) {
                return; // No match selected
            }

            // Showing loading indicator
            loadingDiv.style.display = 'block';

            try {
                // Creating new visualization if not exists
                if (!viz) {
                    viz = new SoccerVisualization('#visualization');
                }

                // Initializing with selected match
                await viz.initialize(selectedMatch);

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
                    viz.updateFrame(0);
                });

                // Hiding loading indicator
                loadingDiv.style.display = 'none';
            } catch (error) {
                loadingDiv.style.display = 'none';
                console.error('Error loading visualization:', error);
            }
        });

    } catch (error) {
        loadingDiv.style.display = 'none';
        console.log("Error loading match configurations:", error);
    }
}