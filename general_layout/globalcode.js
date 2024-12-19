const ctx = {
    competitions: [], // name of all competitions
    // ctx.competitionsData is the all competitions.json file
    teams: [], // teams presents in the competition selected for the year selected
    games: [], // games ID of the selected team for the selected year in the selected competition
};


function initPage() {
    console.log("d3 version " + d3.version);
    // add here the creation of SVG elements
    // initial SVG elements creations for PART 1
    // initial SVG elements creations for PART 2
    let part2svgEl = d3.select("#svg-container-part2").append("svg").attr("id", "svgPart2");
    part2svgEl.attr("width", c2.WIDTH);
    part2svgEl.attr("height", c2.HEIGHT);
    
    // initial SVG elements creations for PART 3


    loadCompetitions(); // TO PUT BACK UNCOMMENTED!! JUST IN DEVELOPMENT
    populateMetricsList();
    //updateGameChosen();
};

function createViz() {
    // part 1 (Gloire)
    //vizPart1();
    // part 2 (Yann)
    vizPart2();
    // part 3 (Yong)
    //vizPart3()
}

/* ---- Adapt menu and data loading files ---- */

function loadCompetitions() {
    d3.json("../data/competitions.json").then(
        function(data) {
            let compSelect = document.getElementById("competition");
            
            // fetch name of competitions available and add them to options in the form
            data.forEach(element => {
                if (! ctx.competitions.includes(element.competition_name)) {
                    ctx.competitions.push(element.competition_name);
                    const opt = document.createElement('option');
                    opt.value = element.competition_name;
                    opt.innerHTML = element.competition_name;
                    compSelect.appendChild(opt);
                }
            });
            ctx.competitionsData = data;
            //console.log("Competitions data: ", data);
        }
    ).catch(function(error){console.log(error)});
};

// called when the first select of the form is modified
function updateCompetitionChosen() {
    let i = gameChoice.competition.value;
    if (i === "Select a competition") {
        return;
    };

    // Reset the field of the downstream options
    resetSeasonOption();
    resetTeamOption();
    resetGameOption();
    
    let seasonSelect = document.getElementById("season");
    ctx.competitionsData.forEach(element => {
        if (element.competition_name === i) {
            // add the Year option in the second select
            const opt = document.createElement('option');
            opt.value = element.season_name;
            opt.innerHTML = element.season_name;
            seasonSelect.appendChild(opt);
        };
    });
};

// called when the second select of the form is modified (ignores if First select is not valid)
function updateSeasonChosen() {
    let i = gameChoice.season.value;
    if (i === "Select a season") {
        return;
    };

    // Reset the field of the downstream options
    resetTeamOption();
    resetGameOption();

    ctx.competitionsData.forEach(element => {
        if ((element.competition_name === gameChoice.competition.value) && (element.season_name === gameChoice.season.value)) {
            ctx.currentCompID = element.competition_id;
            ctx.currentSeasonID = element.season_id;
        }
    });

    let teamSelect = document.getElementById("team");
    ctx.path = `../data/matches/` + ctx.currentCompID + `/` + ctx.currentSeasonID + `.json`; // current json of matches (for 1 comp 1 year)
    d3.json(ctx.path).then(function(data) {
        ctx.teams = [];
        data.forEach(element => {
            if (! ctx.teams.includes(element.home_team.home_team_name)) {
                ctx.teams.push(element.home_team.home_team_name);
                const opt = document.createElement('option');
                opt.value = element.home_team.home_team_name;
                opt.innerHTML = element.home_team.home_team_name;
                teamSelect.appendChild(opt);
            }
            if (! ctx.teams.includes(element.away_team.away_team_name)) {
                ctx.teams.push(element.away_team.away_team_name);
                const opt = document.createElement('option');
                opt.value = element.away_team.away_team_name;
                opt.innerHTML = element.away_team.away_team_name;
                teamSelect.appendChild(opt);
            }
        ctx.matchesData = data;
        //console.log("Matches data: ", data);
        });
    }).catch(function(error){console.log(error)});

};

// when called when the thrid select of the form is modified (ingores if First and Second select are not valid)
function updateTeamChosen() {
    let i = gameChoice.team.value;
    if (i === "Select a team") {
        return;
    };

    // Reset the field of the downstream options
    resetGameOption();

    let gameSelect = document.getElementById("game");
    ctx.games = [];
    ctx.matchesData.forEach(element => {
        if ((element.home_team.home_team_name === i) || (element.away_team.away_team_name === i)) {
            const homeBool = (element.home_team.home_team_name === i);
            ctx.games.push(
                {
                    gameID: element.match_id,
                    competition_stage: element.competition_stage.name,
                    against: (homeBool ? element.away_team.away_team_name: element.home_team.home_team_name),
                    place: (homeBool ? "Home" : "Away"),
                }
            );
        };
    });
    ctx.games.forEach(element => {
        const opt = document.createElement('option');
        opt.value = element.gameID;
        opt.innerHTML = element.competition_stage + " - vs " + element.against + " (" + element.place + ")";
        gameSelect.appendChild(opt);
    });
};

// called when the fourth select of the form is modified (ignores if First, Second and Third select are not valid)
function updateGameChosen() {
    //let i = gameChoice.game.value;
    let i = 7567; // TO DELETE !! JUST IN DEVELOPMENT
    if (i === "Select a game") {
        return;
    };

    ctx.currentGameID = i;
    d3.json("../data/events/" + i + ".json").then(function(data) {
        ctx.gameData = data;
        console.log("Game file " + i + ".json is loaded");
        // simple load so everyone can access this in its own js file and treat it like he wants
        createViz();
    });
};


/* ------ Utilities ------- */

// takes data from a json and returns the list of elements that match some pattern
function matchDataToOptions(data, i, ) {
    // maybe later to make the code clearer and more compact
};

function resetSeasonOption() {
    let seasonSelect = document.getElementById("season");
    let childS = seasonSelect.lastElementChild;
    while (childS) {
        seasonSelect.removeChild(childS);
        childS = seasonSelect.lastElementChild;
    }
    let optS = document.createElement('option');
    optS.innerHTML = "Select a season";
    seasonSelect.appendChild(optS);
};

function resetTeamOption() {
    let teamSelect = document.getElementById("team");
    let childT = teamSelect.lastElementChild;
    while (childT) {
        teamSelect.removeChild(childT);
        childT = teamSelect.lastElementChild;
    }
    let optT = document.createElement('option');
    optT.innerHTML = "Select a team";
    teamSelect.appendChild(optT);
};

function resetGameOption() {
    let gameSelect = document.getElementById("game");
    let childG = gameSelect.lastElementChild;
    while (childG) {
        gameSelect.removeChild(childG);
        childG = gameSelect.lastElementChild;
    }
    let optG = document.createElement('option');
    optG.innerHTML = "Select a game";
    gameSelect.appendChild(optG);
}