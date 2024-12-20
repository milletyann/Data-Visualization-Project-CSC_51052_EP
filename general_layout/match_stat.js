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

// Function to extract players from events
function GetPlayer(events, homeTeamId, awayTeamId) {
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

function DrawLineUp(Pitch, H, W){
    const svg = Pitch.append("div").attr("class", "football-pitch");
    const pitch = svg.append("svg")
        .attr("width", W)
        .attr("height", H);
    
    // Pitch Outline
    pitch.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", W - 20)
        .attr("height", H - 20)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    // Halfway line
    pitch.append("line")
        .attr("x1", 10)
        .attr("y1", H / 2)
        .attr("x2", W - 10)
        .attr("y2", H / 2)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    // Centre circle
    pitch.append("circle")
        .attr("cx", W / 2)
        .attr("cy", H / 2)
        .attr("r", 50)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    
    // Home penalty box
    pitch.append("rect")
        .attr("x", W/2 - 0.2*W)
        .attr("y", 10)
        .attr("width", 0.4*W)
        .attr("height", 0.1*H)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    // Home goal box
    pitch.append("rect")
        .attr("x", W/2 - 0.1*W)
        .attr("y", 10)
        .attr("width", 0.2*W)
        .attr("height", 0.04*H)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);
        
    // Away penalty box
    pitch.append("rect")
        .attr("x", W/2 - 0.2*W)
        .attr("y", H - 0.1*H - 10)
        .attr("width", 0.4*W)
        .attr("height", 0.1*H)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    // Away goal box
    pitch.append("rect")
        .attr("x", W/2 - 0.1*W)
        .attr("y", H - 0.04*H - 10)
        .attr("width", 0.2*W)
        .attr("height", 0.04*H)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);
}

function Player_Position(pitch,players, H, W){
    console.log("Drawing players on the pitch");
    console.log("11 players: ", players);
    position_play = {
        home : {
            "Goalkeeper" : [W/2, 0.1*H],
            "Right Back" : [W/2 + 0.2*W, 0.2*H],
            "Right Center Back" : [W/2 + 0.1*W, 0.3*H],
            "Left Center Back" : [W/2 - 0.1*W, 0.3*H],
            "Left Back" : [W/2 - 0.2*W, 0.2*H],
            "Center Defensive Midfield" : [W/2, 0.4*H],
            "Right Center Midfield" : [W/2 + 0.1*W, 0.4*H],
            "Right Defensive Midfield" : [W/2 + 0.3*W, 0.4*H],
            "Left Defensive Midfield" : [W/2 - 0.3*W, 0.4*H],
            "Right Wing" : [W/2 + 0.4*W, 0.5*H],
            "Centre Attacking Midfield" : [W/2, 0.5*H],
            "Left Wing" : [W/2 - 0.4*W, 0.5*H],
            "Center Forward" : [W/2, 0.6*H],
            "Right Midfield" : [W/2 + 0.3*W, 0.5*H],
            "Left Center Midfield" : [W/2 - 0.3*W, 0.5*H],
            "Right Center Forward" : [W/2 + 0.1*W, 0.6*H]

        },
        away : {
            "Goalkeeper" : [W/2, 0.9*H],
            "Right Back" : [W/2 + 0.2*W, 0.8*H],
            "Right Center Back" : [W/2 + 0.1*W, 0.7*H],
            "Left Center Back" : [W/2 - 0.1*W, 0.7*H],
            "Left Back" : [W/2 - 0.2*W, 0.8*H],
            "Center Defensive Midfield" : [W/2, 0.6*H],
            "Right Center Midfield" : [W/2 + 0.1*W, 0.6*H],
            "Right Defensive Midfield" : [W/2 + 0.3*W, 0.6*H],
            "Left Defensive Midfield" : [W/2 - 0.3*W, 0.6*H],
            "Right Wing" : [W/2 + 0.4*W, 0.5*H],
            "Centre Attacking Midfield" : [W/2, 0.5*H],
            "Left Wing" : [W/2 - 0.4*W, 0.5*H],
            "Center Forward" : [W/2, 0.4*H],
            "Right Midfield" : [W/2 + 0.3*W, 0.5*H],
            "Left Center Midfield" : [W/2 - 0.3*W, 0.5*H],
            "Right Center Forward" : [W/2 + 0.1*W, 0.4*H]
        }
    }
    // Function to draw players on the pitch
    function drawPlayers(teamKey, players) {
        players.forEach(player => {
            const pos = position_play[teamKey][player.position];
            console.log("Player position: ", pos);
            if (pos) {
                pitch.append("circle")
                    .attr("cx", pos[0])
                    .attr("cy", pos[1])
                    .attr("r", 10)
                    .attr("fill", teamKey === "home" ? "blue" : "red")
                    .attr("stroke", "white")
                    .attr("stroke-width", 2);

                // Adding player number or name
                pitch.append("text")
                    .attr("x", pos[0])
                    .attr("y", pos[1] + 4)  // Adjust to center the text vertically relative to the circle
                    .attr("text-anchor", "middle")
                    .text(player.number)
                    .attr("fill", "white")
                    .style("font-size", "12px")
                    .style("font-weight", "bold");
            }
        });
    }

    // Draw home and away players
    drawPlayers("home", players.home);
    drawPlayers("away", players.away);

} 


// Function to display lineups
function displayLineups() {
    // set the active button
    setActiveButton('lineups-btn');
    displaySection('lineups');
    // TODO
    // Extract the players from the events
    const players = GetPlayer(ctx.gameData, ctx.homeTeamId, ctx.awayTeamId);
    console.log("Players: ", players);
    // Find the substitutions
    const substitutions = findSubstitution(ctx.gameData, ctx.homeTeamId, ctx.awayTeamId);
    console.log("Substitutions: ", substitutions);

    // Display the lineups
    const container = d3.select("#lineups");
    container.html('');  // Clear previous contents
    const H = 1000;
    const W = 600;
    const Pitch = d3.select("#lineups").append("div").attr("class", "football-pitch");
    //Fillter only the first 11 players not in the substitution list
    const players_home = players.home.filter(player => !substitutions.home.find(sub => sub.playerIn === player.id));
    const players_away = players.away.filter(player => !substitutions.away.find(sub => sub.playerIn === player.id));
    // Combine the home and away players
    const players_new = { home: players_home, away: players_away };

    DrawLineUp(Pitch, H, W);
    Player_Position(Pitch, players_new, H, W);
    
}

// Add event listener for the button click
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('match-stats-btn').addEventListener('click', handleMatchStatsClick);
    //document.getElementById('lineups-btn').addEventListener('click', displayLineups);
});

