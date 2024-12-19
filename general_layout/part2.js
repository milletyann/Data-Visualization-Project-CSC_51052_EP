c2 = {
    // part2 svg size
    HEIGHT: 480,
    WIDTH: 820,
    // visualization 1 selected (true if players-comparison, false if players-ranking)
    viz: true,
    // players lists
    homePlayers: [],
    awayPlayers: [],
    // 
    comparedPlayers: {
        home: null,
        away: null,
    }
};

function vizPart2() {
    // List all players that played
    c2.homePlayers = extractPlayers(ctx.currentGameID, ctx.gameData[0].team.name, true);
    c2.awayPlayers = extractPlayers(ctx.currentGameID, ctx.gameData[1].team.name, false);
    console.log(c2.homePlayers);
    console.log(c2.awayPlayers);
    //populateSideLists();
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

function populateSideLists() {
    const leftList = document.getElementById("list-left");
    c2.homePlayers.forEach(item => {
        const li = document.createElement("li");
        li.classList.add("player-name");
        li.textContent = item.name;
        li.addEventListener("click", () => handleLeftListClick(item));
        leftList.appendChild(li);
    });

    const rightList = document.getElementById("list-right");
    c2.awayPlayers.forEach(item => {
        const li = document.createElement("li");
        li.classList.add("player-name");
        li.textContent = item.name;
        li.addEventListener("click", () => handleRightListClick(item));
        rightList.appendChild(li);
    });
}

function handleLeftListClick(item) {
    c2.comparedPlayers.home = item;
    console.log(item);
    triggerUpdatePlayerComparison(item, null);
}

function handleRightListClick(item) {
    c2.comparedPlayers.away = item;
    console.log(item);
    triggerUpdatePlayerComparison(null, item);
}

/* ------- Populating SVG ------- */

function setDefaultStats() {
    console.log("Je remplis les svg avec des choix par defaults");
    // choix des joueurs à comparer en 1v1
    // choix de la stat à faire pour comparer le top 10
}



/* ------- Transitions SVG ------- */

// updates the visualizations for the player that triggered the function (in practice there is always one of the 2 parameters that is null)
function triggerUpdatePlayerComparison(homePlayer, awayPlayer) {
    console.log("j'update la visu pour changer un joueur");
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
                minutes_played: 0,
                goals_scored: 0, //
                assists: 0, 
                cards: {
                    yellow: 0,
                    red: 0,
                },
                MotM: false,
                shots: {
                    total: 0, //
                    left_foot: 0,
                    right_foot: 0,
                    head: 0,
                },
                balls_touched: 0,
                distance_ran: 0,
            },
            defense: {
                tackles_successful: 0,
                tackles_missed: 0,
                aerials_won: 0,
                aerials_loss: 0,
                interceptions: 0,
                faults: 0,
                dribbles_suffered: 0,
                own_goals: 0,
            },
            attack: {
                key_passes: 0,
                faults_suffered: 0,
                dribbles_successful: 0,
                dribbles_missed: 0,
                offside: 0,
                xG: 0, //
                xG_diff: 0,
                xG_per_shot: 0,
            },
            passing: {
                passes_successful: 0,
                passes_missed: 0,
                avg_pass_length: 0,
                ball_loss: 0,
            },
        }
    });

    return players;
};

// ajouter postes des joueurs
// ajouter la durée totale du match

function iterateEvents() {
    console.log("Maintenant je passe sur les evenements du match");
    ctx.gameData.forEach(event => {
        // joueur concerné directement
        let player = findPlayer(event.player.id);
        // On passe sur les tirs
        if (event.shot) {
            //console.log("tir de " + event.player.name);
            player.stats.general.shots.total++;
            player.stats.attack.xG += event.shot.statsbomb_xg;
            if (event.shot.outcome.name === 'Goal') {
                player.stats.general.goals_scored++;
                //console.log("BUT de " + event.player.name + " for " + event.team.name);
            };
            if (event.shot.body_part.name === "Left Foot") {
                
            };
        }
    })
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
// fonction pour trier les tops players en fonction d'une certaine stats
// fonctions annexes pour calculer des trucs (temps de jeu, distance courue...)