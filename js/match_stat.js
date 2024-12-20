// Example data to pass to the function
const matchExample = {
    home: {
        name: "Vallecano",
        score: 3,
        logo: "vallecano_logo.png",
        goals: [
            { scorer: "I. Palazon", minute: 64 },
            { scorer: "A. Mumin", minute: 36 },
            { scorer: "U. Lopez", minute: 4 }
        ]
    },
    away: {
        name: "Real Madrid",
        score: 3,
        logo: "real_madrid_logo.jpeg",
        goals: [
            { scorer: "Rodrygo", minute: 56 },
            { scorer: "J. Bellingham", minute: 45 },
            { scorer: "F. Valverde", minute: 39 }
        ]
    },
};

function updateMatchCard(matchData) {
    const card = d3.select("#match-card");

    // Clear previous content
    card.html('');

    const header = card.append("div").attr("class", "match-header");

    // Home team
    const homeTeam = header.append("div").attr("class", "team");
    homeTeam.append("img")
        .attr("src", matchData.home.logo)
        .attr("alt", `${matchData.home.name} Logo`)
        .attr("class", "team-logo");

    const homeInfo = homeTeam.append("div").attr("class", "team-score");
    homeInfo.append("h2").text(matchData.home.name);
    homeInfo.append("p").text(matchData.home.score);

    // Match info
    const matchInfo = header.append("div").attr("class", "match-info");
    matchInfo.append("p").text(matchData.status);
    matchInfo.append("p").text(`${matchData.home.score} - ${matchData.away.score}`);
    matchInfo.append("p").text(`${matchData.league}, ${matchData.week}`);
    matchInfo.append("p").text(matchData.venue);

    // Away team
    const awayTeam = header.append("div").attr("class", "team");
    const awayInfo = awayTeam.append("div").attr("class", "team-score");
    awayInfo.append("h2").text(matchData.away.name);
    awayInfo.append("p").text(matchData.away.score);
    awayTeam.append("img")
        .attr("src", matchData.away.logo)
        .attr("alt", `${matchData.away.name} Logo`)
        .attr("class", "team-logo");

    // Goals
    const goals = card.append("div").attr("class", "match-goals");
    const homeGoals = goals.append("div");
    matchData.home.goals.forEach(goal => {
        homeGoals.append("p").text(`${goal.scorer} ${goal.minute}'`);
    });

    const awayGoals = goals.append("div");
    matchData.away.goals.forEach(goal => {
        awayGoals.append("p").text(`${goal.scorer} ${goal.minute}'`);
    });
}


function hideAllSections() {
    document.getElementById('timeline').style.display = 'none';
    document.getElementById('match-stats').style.display = 'none';
    document.getElementById('lineups').style.display = 'none';
}

function displayTimeline() {
    setActiveButton('timeline-btn');
    displaySection('timeline');
}

function displayMatchStats(matchData) {
    console.log("Displaying Match Stats:", matchData.stats);
    const container = d3.select("#match-stats");
    container.html('');  // Clear previous contents

    // Display the logo row for each team
    const logosRow = container.append("div").attr("class", "stat-row-logos");
    logosRow.append("img")
        .attr("src", matchData.home.logo)
        .attr("alt", `${matchData.home.name} Logo`)
        .attr("class", "team-logo-small");
    logosRow.append("div").attr("class", "spacer"); // For central spacing
    logosRow.append("img")
        .attr("src", matchData.away.logo)
        .attr("alt", `${matchData.away.name} Logo`)
        .attr("class", "team-logo");

    // Display the stats row for each team
    Object.keys(matchData.stats).forEach(stat => {
        console.log("Stat:", stat, matchData.stats[stat]);
        const maxStatValue = (stat === "Possession %") ? 100 : Math.max(matchData.stats[stat][matchData.home.name], matchData.stats[stat][matchData.away.name]);

        const statRow = container.append("div").attr("class", "stat-row");
        const statValueContainer = statRow.append("div").attr("class", "stat-value-container");

        statValueContainer.append("div").attr("class", "stat-value home").text(matchData.stats[stat][matchData.home.name]);
        statValueContainer.append("div").attr("class", "stat-name").text(stat);
        statValueContainer.append("div").attr("class", "stat-value away").text(matchData.stats[stat][matchData.away.name]);

        const barContainer = statRow.append("div").attr("class", "bar-container");

        const scale = d3.scaleLinear()
            .domain([0, maxStatValue])
            .range([0, 50]); // max 50% width from center to side

        // Home bar (grows to left)
        barContainer.append("div")
            .attr("class", "stat-bar home")
            .style("width", scale(matchData.stats[stat][matchData.home.name]) + "%");

        // Away bar (grows to right)
        barContainer.append("div")
            .attr("class", "stat-bar away")
            .style("width", scale(matchData.stats[stat][matchData.away.name]) + "%");
    });


    setActiveButton('match-stats-btn');
    displaySection('match-stats');
}
function displayLineups() {
    setActiveButton('lineups-btn');
    displaySection('lineups');
}

function displaySection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}
function setActiveButton(buttonId) {
    document.querySelectorAll('.navbar button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(buttonId).classList.add('active');
}

document.addEventListener("DOMContentLoaded", function() {
    updateMatchCard(matchExample); // Load the match card data on page load
    setActiveButton('timeline-btn'); // Set initial active button
    displayTimeline(); // Initial display
});