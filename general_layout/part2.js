c2 = {
    // part2 svg size
    svgHEIGHT: 400,
    svgWIDTH: 680,
    margin: { top: 20, right: 20, bottom: 30, left: 50 },
    // players lists
    homePlayers: [],
    awayPlayers: [],
    // Metrics to be proposed in the left list menu
    metrics: [
        {name: "general-minutes_played", text: "Playing Time"},
        {name: "general-goals_scored", text: "Goals"},
        {name: "general-cards-yellow", text: "Yellow Cards"},
        {name: "general-cards-red", text: "Red Cards"},
        {name: "general-shots-total", text: "Total Shots"},
        {name: "general-shots-left_foot", text: "Left Foot Shots"},
        {name: "general-shots-right_foot", text: "Right Foot Shots"},
        {name: "general-shots-head", text: "Head Shots"},
        {name: "general-balls_touched", text: "Balls Touched"},
        {name: "general-distance_ran_with_ball", text: "Distance with Ball"},
        {name: "general-time_with_ball", text: "Time with Ball"},
        {name: "defense-tackles_successful", text: "Tackles Completed"},
        {name: "defense-tackles_missed", text: "Tackles Missed"},
        {name: "defense-interceptions", text: "Interceptions"},
        {name: "defense-aerials_won", text: "Aerials Won"},
        {name: "defense-aerials_loss", text: "Aerials Lost"},
        {name: "defense-faults", text: "Faults"},
        {name: "defense-dribbles_suffered", text: "Dribbles Suffered"},
        {name: "defense-own_goals", text: "Own Goals"},
        {name: "attack-faults_won", text: "Faults Provoked"},
        {name: "attack-dribbles_successful", text: "Dribbles Won"},
        {name: "attack-dribbles_missed", text: "Dribbles Lost"},
        {name: "attack-offsides", text: "Offsides"},
        {name: "attack-xG", text: "xG"},
        {name: "attack-xG_diff", text: "xG Difference"},
        {name: "attack-xG_per_shot", text: "xG per Shot"},
        {name: "passing-assists", text: "Assists"},
        {name: "passing-key_passes", text: "Key Passes"},
        {name: "passing-passes_successful", text: "Completed Passes"},
        {name: "passing-passes_missed", text: "Missed Passes"},
        {name: "passing-avg_pass_length", text: "Average Pass Length"},
        {name: "passing-ball_loss", text: "Ball Losses"},
        {name: "goalkeeper-goals_conceded", text: "Goals Conceded"},
        {name: "goalkeeper-penalty_conceded", text: "Conceded Penalties"},
        {name: "goalkeeper-penalty_saved", text: "Saved Penalties"},
        {name: "goalkeeper-shots_saved", text: "Saved Shots"},
        {name: "goalkeeper-digs_successful", text: "Successful Digs"},
        {name: "goalkeeper-punch", text: "Punches"},
    ],
    // Number of players displayed in the chart
    n: 10,
};

function vizPart2() {
    // List all players that played
    c2.homePlayers = extractPlayers(ctx.currentGameID, ctx.gameData[0].team.name, true);
    c2.awayPlayers = extractPlayers(ctx.currentGameID, ctx.gameData[1].team.name, false);

    populateMetricsList();
    iterateEvents();
}

/* ------- HTML related functions ------- */

function populateMetricsList() {
    const leftList = document.getElementById("list-left");

    while (leftList.firstChild) {
      leftList.removeChild(leftList.firstChild);
    };

    const h3 = document.createElement("h3");
    h3.innerHTML = "Metrics";
    leftList.appendChild(h3);
    const ul = document.createElement("ul");
    leftList.appendChild(ul);

    c2.metrics.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.text;
      li.addEventListener("click", () => handleListItemClick(item.name));
      ul.appendChild(li);
    });
}

/* ------- Populating SVG ------- */

function displayBarChart(topN, path) {
    const maxVal = d3.max(topN, o => getPropertyValue(o, path));
    c2.chartWidth = c2.svgWIDTH - c2.margin.left - c2.margin.right;
    c2.chartHeight = c2.svgHEIGHT - c2.margin.top - c2.margin.bottom;

    c2.xScale = d3.scaleBand().domain(topN.map(d => d.name)).range([0, c2.chartWidth]).align(0);
    c2.yScale = d3.scaleLinear().domain([0, maxVal]).range([c2.chartHeight, 0]);

    const svgContainer = d3.select("#svgPart2");

    const lc = svgContainer.lastElementChild;
    while (lc) {
        svgContainer.removeChild(lc);
        lc = svgContainer.lastElementChild
    };

    const mainG = svgContainer.append("g")
        .attr("transform", `translate(${c2.margin.left},${c2.margin.top})`)
        .attr("id", "mainG");

    mainG.append("g")
        .call(d3.axisLeft(c2.yScale))
        .attr("class", "y-axis");

    mainG.append("g")
        .attr("transform", `translate(0,${c2.chartHeight})`)
        .call(d3.axisBottom(c2.xScale))
        .attr("class", "x-axis");

    const xSpacing = c2.xScale.bandwidth();
    const barGroups = mainG.selectAll(".bar-group")
        .data(topN)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d, i)=> `translate(${(i+1/3)*xSpacing}, 0)`)
        .attr("y", d => c2.xScale(getPropertyValue(d, path)))
        
    barGroups.append('rect')
        .attr("width", c2.xScale.bandwidth() - 20)
        .attr("height", d => c2.chartHeight - c2.yScale(getPropertyValue(d, path)))
        .attr("fill", "blue");

}


/* ------- Transitions SVG ------- */

function handleListItemClick(item_name) {
    let path = item_name.split('-');

    let combine = [...c2.homePlayers, ...c2.awayPlayers];

    combine.sort((a, b) => {
        const valueA = getPropertyValue(a, path) || 0;
        const valueB = getPropertyValue(b, path) || 0;
        return valueB - valueA;
    });

    topN = combine.slice(0,c2.n);
    displayBarChart(topN, path);
}

/* ------- Data Extraction ------- */

function extractPlayers(game_id, teamName, home) {
    let players = [];
    ctx.gameData.forEach(element => {
        if (element.team.name === teamName) {
            if (element.type.name === 'Starting XI') { // considere les compo initiales
                element.tactics.lineup.forEach(el => {
                    j = el.player;
                    j.team = element.team;
                    j.enters_at = [element.minute, element.second];
                    j.subbed = null;
                    j.titu = true;
                    players.push(j);
                });

            } else if (element.type.name === 'Substitution') { // considere les changements
                j = element.substitution.replacement;
                j.team = element.team;
                j.enters_at = [element.minute, element.second];
                j.subbed = null;
                j.titu = false;
                players.push(j);

                // subbed player info update
                let playerSubbed = players.find(item => item.id === element.player.id);
                playerSubbed.leaves_at = [element.minute, element.second];
                playerSubbed.subbed = true;
                playerSubbed.subReason = element.substitution.outcome.name;
            };
        };
    });
    // complete the data for the unsubbed players
    players.forEach(j => {
        if (j.leaves_at === undefined) {
            j.leaves_at = [ctx.gameData[ctx.gameData.length - 1].minute, ctx.gameData[ctx.gameData.length - 1].second];
            j.subbed = false;
        };
        j.stats = {
            general: {
                minutes_played: j.leaves_at[0] - j.enters_at[0],
                goals_scored: 0,
                cards: {
                    yellow: 0,
                    red: 0,
                },
                shots: {
                    total: 0,
                    left_foot: 0,
                    right_foot: 0,
                    head: 0,
                },
                balls_touched: 0,
                distance_ran_with_ball: 0,
                time_with_ball: 0,
            },
            defense: {
                tackles_successful: 0,
                tackles_missed: 0,
                interceptions: 0,
                aerials_won: 0,
                aerials_loss: 0,
                faults: 0,
                dribbles_suffered: 0,
                own_goals: 0,
            },
            attack: {
                faults_won: 0,
                dribbles_successful: 0,
                dribbles_missed: 0,
                offsides: 0,
                xG: 0,
                xG_diff: 0,
                xG_per_shot: 0,
            },
            passing: {
                assists: 0,
                key_passes: 0,
                passes_successful: 0,
                passes_missed: 0,
                avg_pass_length: 0,
                ball_loss: 0,
            },
            goalkeeper: {
                goals_conceded: 0,
                penalty_conceded: 0,
                penalty_saved: 0,
                shots_saved: 0,
                digs_successful: 0,
                punch: 0,
            }
        }
    });

    return players;
};

// ajouter postes des joueurs
// ajouter la durée totale du match

function iterateEvents() {
    ctx.gameData.forEach(event => {
        if (event.player) {
            let player = findPlayer(event.player.id); // joueur concerné directement
            if (event.shot) {
                if (event.shot.outcome.name === 'Goal') {
                    player.stats.general.goals_scored++;
                };
                if (event.shot.body_part.name === "Left Foot") {
                    player.stats.general.shots.left_foot++;
                } else if (event.shot.body_part.name === "Right Foot") {
                    player.stats.general.shots.right_foot++;
                } else if (event.shot.body_part.name === "Head") {
                    player.stats.general.shots.head++;
                };
                player.stats.general.balls_touched++;
                player.stats.general.shots.total++;
                player.stats.attack.xG += event.shot.statsbomb_xg;
            } else if (event.pass) {
                if (event.pass.outcome) {
                    if (event.pass.outcome.name === "Incomplete" || event.pass.outcome.name === "Out") {
                        player.stats.passing.passes_missed++;
                    } else if (event.pass.outcome.name === "Pass Offside") {
                        let os_player = findPlayer(event.pass.recipient.id);
                        os_player.stats.attack.offsides++;
                    };
                } else {
                    player.stats.passing.passes_successful++;
                }
                if (event.pass.shot_assist) {
                    player.stats.passing.key_passes++;
                };
                if (event.pass.goal_assist) {
                    player.stats.passing.assists++;
                };
                if (event.pass.aerial_won) {
                    player.stats.defense.aerials_won++;
                };
                player.stats.passing.avg_pass_length += fromYardsToMeters(event.pass.length);
                player.stats.general.balls_touched++;
            } else if (event.bad_behaviour) {
                event.bad_behaviour.card.name === "Yellow Card" ? player.stats.general.cards.yellow++ : player.stats.general.cards.red++;
            } else if (event.type.name === "Foul Committed") {
                player.stats.defense.faults++;
            } else if (event.type.name === "Foul Won") {
                player.stats.attack.faults_won++;
            } else if (event.type.name === "Interception") {
                player.stats.defense.interceptions++;
                player.stats.general.balls_touched++;
            } else if (event.type.name === "Dispossessed") {
                player.stats.passing.ball_loss++;
            } else if (event.type.name === "Ball Receipt") {
                player.stats.general.balls_touched++;
            } else if (event.type.name === "Duel") {
                if (event.duel.type.name === "Tackle") {
                    if ((event.duel.outcome.name==="Won")||(event.duel.outcome.name==="Success In Play")||(event.duel.outcome.name==="Success")||(event.duel.outcome.name==="Success Out")) {
                        player.stats.defense.tackles_successful++;
                    } else {
                        player.stats.defense.tackles_missed++;
                    };
                } else if (event.duel.type.name === "Aerial Lost") {
                    player.stats.defense.aerials_loss++;
                };
            } else if (event.type.name === "Carry") {
                player.stats.general.time_with_ball += event.duration;
                player.stats.general.distance_ran_with_ball += fromYardsToMeters(Math.sqrt((event.location[0] - event.carry.end_location[0])**2 + (event.location[1] - event.carry.end_location[1])**2));
            } else if (event.type.name === "Own Goal Against") {
                player.stats.defense.own_goals++;
                player.stats.general.balls_touched++;
            } else if (event.dribble) {
                event.dribble.outcome.name === "Complete" ? player.stats.attack.dribbles_successful : player.stats.attack.dribbles_missed;
            } else if (event.type.name === "Dribbled Past") {
                player.stats.defense.dribbles_suffered++;
            } else if (event.type.name === "Offside") {
                player.stats.attack.offsides++;
            } else if (event.goalkeeper) {
                const typeGK = event.goalkeeper.type.name;
                if (typeGK === "Goal Conceded") {
                    player.stats.goalkeeper.goals_conceded++;
                } else if (typeGK === "Penalty Conceded") {
                    player.stats.goalkeeper.penalty_conceded++;
                    player.stats.goalkeeper.goals_conceded++;
                } else if (typeGK === "Penalty Saved") {
                    player.stats.goalkeeper.penalty_saved++;
                } else if (typeGK === "Smother") {
                    const outcome = event.goalkeeper.outcome.name;
                    if (["Success", "Success In Play", "Success Out"].includes(outcome)) {
                        player.stats.defense.tackles_successful++;
                    } else if (["Lost", "Lost In Play", "Lost Out"].includes(outcome)) {
                        player.stats.defense.tackles_missed++;
                    };
                    player.stats.general.balls_touched++;
                } else if (typeGK === "Punch") {
                    player.stats.goalkeeper.punch++;
                    player.stats.general.balls_touched++;
                } else if (typeGK === "Collected" && event.goalkeeper.outcome.name === "Success") {
                    player.stats.general.balls_touched++;
                };
                if (typeGK === "Shot Saved") {
                    player.stats.goalkeeper.shots_saved++;
                    player.stats.general.balls_touched++;
                };
                if (event.goalkeeper.technique) {
                    if ((event.goalkeeper.technique.name === "Diving") && (typeGK === "Shot Saved")) {
                        player.stats.goalkeeper.digs_successful++;
                    };
                };
            };
        };
    });
    c2.homePlayers.forEach(j => {
        j.stats.attack.xG_diff = j.stats.general.goals_scored - j.stats.attack.xG; // xG_diff
        j.stats.general.shots.total != 0 ? j.stats.attack.xG_per_shot = j.stats.attack.xG / j.stats.general.shots.total : 0; // xG_per_shot
        j.stats.passing.avg_pass_length /= (j.stats.passing.passes_missed + j.stats.passing.passes_successful); // avg_pass_length
    });
    // a la fin de cette fonction on a des données utilisables
};

/* ------- Stats Computations ------- */

// returns the player that is involved (searches in both home and away arrays)
function findPlayer(id_player) {
    let player = c2.homePlayers.find(pl => pl.id === id_player);
    if (player) {
        return player;
    } else {
        player = c2.awayPlayers.find(pl => pl.id === id_player);
        return player;
    }
};

function fromYardsToMeters(value) {
    return 0.9144*value;
};

function getPropertyValue(obj, pathArray) {
    // idea: .reduce() for cleaner syntax
    let val = obj['stats'];
    for (let i=0; i<pathArray.length;i++) {
        val = val[pathArray[i]];
    };
    return val;
};