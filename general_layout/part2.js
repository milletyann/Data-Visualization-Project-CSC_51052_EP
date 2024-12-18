context = {
    // part2 size
    HEIGHT: 920,
    WIDTH: 1080,
    // players lists
    homePlayers: [],
    awayPlayers: [],
    // number of events related to player shift in the data
    nbChangeHome: 0,
    nbChangeAway: 0,
    // 
};

function part2() {
    // List all players that played
    context.homePlayers = extractPlayers(ctx.currentGameID, ctx.gameData[0].team.name, true);
    //context.awayPlayers = extractPlayers(ctx.currentGameID, ctx.gameData[1].team.name, false);
    console.log(context.homePlayers);
    //console.log(context.awayPlayers);
    // Pass over all the file to fill the stats object of the players
    iterateEvents();
}

function extractPlayers(game_id, teamName, home) {
    let players = [];
    ctx.gameData.forEach(element => {
        if (element.team.name === teamName) {
            if (element.type.name === 'Starting XI') { // considere les compo initiales
                home ? context.nbChangeHome++ : context.nbChangeAway++; // compte le nb de changements par equipes pour avoir la longueur max de j.n
                element.tactics.lineup.forEach(el => {
                    j = el.player;
                    j.team = element.team;
                    j.enters_at = [element.minute, element.second];
                    j.subbed = null;
                    j.titu = true;
                    players.push(j);
                });

            } else if (element.type.name === 'Substitution') { // considere les changements
                console.log(element);
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
                goals_scored: 0,
                assists: 0,
                cards: {
                    yellow: 0,
                    red: 0,
                },
                MotM: false,
                shots: 0,
                shots_ontarget: 0,
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
                xG: 0,
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
}

// ajouter postes des joueurs
// ajouter la durée totale du match

function iterateEvents() {
    console.log("Maintenant je passe sur les evenements du match");
}