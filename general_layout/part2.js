c2 = {
    // part2 svg size
    HEIGHT: 480,
    WIDTH: 820,
    // players lists
    homePlayers: [],
    awayPlayers: [],
};

function vizPart2() {
    // List all players that played
    c2.homePlayers = extractPlayers(ctx.currentGameID, ctx.gameData[0].team.name, true);
    c2.awayPlayers = extractPlayers(ctx.currentGameID, ctx.gameData[1].team.name, false);
    //populateMetricsList();
    // Pass over all the file to fill the stats object of the players
    iterateEvents();
    // Display defaults stats (first players of their team for example)
    //setDefaultStats();
}

/* ------- HTML related functions ------- */

function initializeButtons() {
    const btn1 = document.getElementById("players-comparison");
    const btn2 = document.getElementById("players-ranking");

    btn1.addEventListener("click", () => toggleVisualizationPart2(btn1, btn2));
    btn2.addEventListener("click", () => toggleVisualizationPart2(btn2, btn1));
}

// Called to switch between the 2 types of visualization (players comparison 2 by 2, players ranking)
function toggleVisualizationPart2(selectedBtn, otherBtn) {
    selectedBtn.classList.add("selected");
    otherBtn.classList.remove("selected");

    //svg.selectAll("*").remove();
    if (selectedBtn.id === "players-comparison") {
        if (c2.viz) {
            return;
        } else {
            c2.viz = !c2.viz;
            console.log("Toggle Versus");
            // METTRE ICI LES TRANSITIONS VERS LA VIZ DES COMPARAISONS
            //addLists();
        }
    } else {
        if (!c2.viz) {
            return;
        } else {
            c2.viz = !c2.viz;
            console.log("Toggle Global");
            // METTRE ICI LE CHANGEMENT VERS LA VIZ DES RANKING JOUEURS
            //removeLists();
            // Initialiser la liste de gauche pour la visu des rankings
            //initializeLeftListRanking();
        }
    }
};

function addLists() {
    let leftList = document.getElementById("list-left");
    leftList.classList.remove("smoothFading");
    let rightList = document.getElementById("list-right");
    rightList.classList.remove("smoothFading");
}

function removeLists() {
    let leftList = document.getElementById("list-left");
    leftList.classList.add("smoothFading");
    let rightList = document.getElementById("list-right");
    rightList.classList.add("smoothFading");
}

function initializeLeftListRanking() {
    // clear la liste
    const leftList = document.getElementById("list-left");
    while (leftList.lastChild) {
        leftList.removeChild(leftList.lastChild);
    };
    console.log(c2.homePlayers[0].stats);
}

function populateMetricsList(data) {
    const leftList = document.getElementById("list-left");

    // Clear existing list items
    while (leftList.firstChild) {
      leftList.removeChild(leftList.firstChild);
    }

    // Populate with new data
    data.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.name;
      li.dataset.action = item.action; // Store the action in a data attribute
      li.addEventListener("click", () => handleListItemClick(item));
      leftList.appendChild(li);
    });
  }

/* ------- Populating SVG ------- */

function setDefaultStats() {
    console.log("Je remplis les svg avec des choix par defaults");
    // choix des joueurs à comparer en 1v1
    // choix de la stat à faire pour comparer le top 10
}



/* ------- Transitions SVG ------- */



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
                xG_diff: 0, // apres
                xG_per_shot: 0, // apres
            },
            passing: {
                assists: 0,
                key_passes: 0,
                passes_successful: 0,
                passes_missed: 0,
                avg_pass_length: 0, // apres
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
        console.log(j);
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
}

function fromYardsToMeters(value) {
    return 0.9144*value;
}
// fonction pour trier les tops players en fonction d'une certaine stats
// fonctions annexes pour calculer des trucs (temps de jeu, distance courue...)