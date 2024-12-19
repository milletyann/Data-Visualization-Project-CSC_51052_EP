function hideAllSections() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
}

function parseMatchStatisticsByTeam(events, homeTeamId, awayTeamId) {
    const stats = {
        home: { "Name": '', "Goal": 0, "Shot": 0, "Pass": 0, "Foul": 0, "Yellow Card": 0, "Red Card": 0, "Offside": 0, "Penalty": 0 },
        away: { "Name": '', "Goal": 0, "Shot": 0, "Pass": 0, "Foul": 0, "Yellow Card": 0, "Red Card": 0, "Offside": 0, "Penalty": 0 }
    };

    events.forEach(event => {
        if (event.team.id === homeTeamId || event.team.id === awayTeamId) {
            const teamKey = event.team.id === homeTeamId ? 'home' : 'away';
            stats[teamKey].Name = event.team.name;
            switch (event.type.name) {
                case "Shot":
                    stats[teamKey].Shot++;
                    if (event.shot && event.shot.outcome.name === "Goal") {
                        stats[teamKey].Goal++;
                    }
                    if (event.shot && event.shot.type.name === "Penalty") {
                        stats[teamKey].Penalty++;
                    }
                    break;
                case "Pass":
                    stats[teamKey].Pass++;
                    break;
                case "Foul Committed":
                    stats[teamKey].Foul++;
                    // Fall through to check for cards
                    if (event.foul && event.foul.card) {
                        if (event.foul.card.name === "Yellow Card" || event.foul.card.name === "Second Yellow") {
                            stats[teamKey]["Yellow Card"]++;
                        } else if (event.foul.card.name === "Red Card") {
                            stats[teamKey]["Red Card"]++;
                        }
                    }
                    break;
                case "Bad Behaviour":
                    if (event.bad_behaviour && event.bad_behaviour.card) {
                        if (event.bad_behaviour.card.name === "Yellow Card" || event.bad_behaviour.card.name === "Second Yellow") {
                            stats[teamKey]["Yellow Card"]++;
                        } else if (event.bad_behaviour.card.name === "Red Card") {
                            stats[teamKey]["Red Card"]++;
                        }
                    }
                    break;
                case "Offside":
                    stats[teamKey].Offside++;
                    break;
            }
        }
    });

    return stats;
}

function displayMatchStats(matchData) {
    console.log("Displaying Match Stats:", matchData);
    if (!matchData || !matchData.home || !matchData.away) {
        console.error("Invalid match data:", matchData);
        return;
    }

    const container = d3.select("#match-stats");
    container.html('');  // Clear previous contents

    // Display the logo row for each team
    const logosRow = container.append("div").attr("class", "stat-row-team-names");
    logosRow.append("text").text(matchData.home.Name).attr("class", "team-name");
    logosRow.append("text").text(matchData.away.Name).attr("class", "team-name");

    // Display the stats row for each team
    const stats = Object.keys(matchData.home).filter(key => key !== 'Name');
    stats.forEach(stat => {
        const maxStatValue = Math.max(matchData.home[stat], matchData.away[stat]);
        console.log("Max stat value: ", maxStatValue);

        const statRow = container.append("div").attr("class", "stat-row");
        const statValueContainer = statRow.append("div").attr("class", "stat-value-container");

        statValueContainer.append("div").attr("class", "stat-value home").text(matchData.home[stat]);
        statValueContainer.append("div").attr("class", "stat-name").text(stat);
        statValueContainer.append("div").attr("class", "stat-value away").text(matchData.away[stat]);

        const barContainer = statRow.append("div").attr("class", "bar-container");

        // Add the vertical line to indicate the origin
        barContainer.append("div").attr("class", "origin-line");

        const scale = d3.scaleLinear()
            .domain([0, maxStatValue])
            .range([0, 50]); // max 50% width from center to side

        // Home bar (grows to left)
        const homeBar = barContainer.append("div")
            .attr("class", "stat-bar home" + (matchData.home[stat] === 0 ? " hidden" : ""))
            .style("width", "0%"); // Start with width 0% for animation

        // Away bar (grows to right)
        const awayBar = barContainer.append("div")
            .attr("class", "stat-bar away" + (matchData.away[stat] === 0 ? " hidden" : ""))
            .style("width", "0%"); // Start with width 0% for animation

        // Animate the bars
        homeBar.transition()
            .duration(500)
            .style("width", scale(matchData.home[stat]) + "%");

        awayBar.transition()
            .duration(500)
            .style("width", scale(matchData.away[stat]) + "%");
    });

    setActiveButton('match-stats-btn');
    displaySection('match-stats');
}



function displaySection(sectionId) {
    hideAllSections();
    document.getElementById(sectionId).style.display = 'block';
}

function setActiveButton(buttonId) {
    document.querySelectorAll('.navbar button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(buttonId).classList.add('active');
}

function vizPart3() {
    setActiveButton('match-stats-btn');
    console.log("All of the type: ", ctx.gameData.map(d => d.type.name));
    const match_stats = parseMatchStatisticsByTeam(ctx.gameData, ctx.homeTeamId, ctx.awayTeamId);
    console.log("Match stats: ", match_stats);
    displayMatchStats(match_stats);
}

// Ensure the displayMatchStats function is called when the button is clicked
function handleMatchStatsClick() {
    if (ctx.gameData && ctx.homeTeamId && ctx.awayTeamId) {
        const match_stats = parseMatchStatisticsByTeam(ctx.gameData, ctx.homeTeamId, ctx.awayTeamId);
        displayMatchStats(match_stats);
    } else {
        console.error("Game data or team IDs are not available.");
    }
}

// Add event listener for the button click
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('match-stats-btn').addEventListener('click', handleMatchStatsClick);
});

// Function to extract players from events
function extractPlayers(events, homeTeamId, awayTeamId) {
    const players = {
        home: [],
        away: []
    };

    events.forEach(event => {
        const teamKey = event.team.id === homeTeamId ? 'home' : 'away';
        if (event.tactics && event.tactics.lineup) {
            event.tactics.lineup.forEach(player => {
                // Check if the player is already in the list
                const existingPlayer = players[teamKey].find(p => p.id === player.player.id);
                if (!existingPlayer) {
                    players[teamKey].push({
                        id: player.player.id,
                        number: player.jersey_number,
                        name: player.player.name,
                        position: player.position.name,
                    });
                }
            });
        }
    });

    return players;
}

// Function to find substitutions
function findSubstitution(events, homeTeamId, awayTeamId) {
    const substitutions = {
        home: [],
        away: []
    };

    events.forEach(event => {
        const teamKey = event.team.id === homeTeamId ? 'home' : 'away';
        if (event.type.name === "Substitution") {
            const playerIn = event.substitution.replacement.id;
            const playerOut = event.player.id;
            const playerInName = event.substitution.replacement.name;
            const playerOutName = event.player.name;
            const time = event.timestamp;
            substitutions[teamKey].push({ playerIn, playerOut, playerInName, playerOutName, time });
        }
    });

    return substitutions;
}


// Function to display lineups
function displayLineups() {
    // set the active button
    setActiveButton('lineups-btn');
    displaySection('lineups');

    const container = d3.select("#lineups");
    container.html('');  // Clear previous contents

    const pitch = custom_d3_soccer.pitch();
    const pitchWidth = pitch.width();
    const totalHeight = pitch.height();
    console.log("Pitch width: ", pitchWidth);
    console.log("Pitch height: ", totalHeight);

    const svg = container.append("svg")
        .attr("width", pitchWidth)
        .attr("height", totalHeight)
        .style("overflow", "visible");

    const pitchGroup = svg.append("g")
        .attr("transform", `translate(${pitchWidth / 2}, ${totalHeight / 2}) scale(${pitchWidth / pitch.width()}, ${totalHeight / pitch.height()})`);

    pitchGroup.call(pitch);
    console.log("display lineups");

    const extractedPlayers = extractPlayers(ctx.gameData, ctx.homeTeamId, ctx.awayTeamId);
    console.log("Extracted players: ", extractedPlayers);

    const substitutions = findSubstitution(ctx.gameData, ctx.homeTeamId, ctx.awayTeamId);
    console.log("Substitutions: ", substitutions);

    // Remove the player that is substituted in
    extractedPlayers.home = extractedPlayers.home.filter(player => !substitutions.home.find(sub => sub.playerIn === player.id));
    extractedPlayers.away = extractedPlayers.away.filter(player => !substitutions.away.find(sub => sub.playerIn === player.id));
    
}

// Add event listener for the button click
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('match-stats-btn').addEventListener('click', handleMatchStatsClick);
    document.getElementById('lineups-btn').addEventListener('click', displayLineups);
});