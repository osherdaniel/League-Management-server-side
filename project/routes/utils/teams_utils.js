const axios = require("axios");
const players_utils = require("./players_utils");
const games_utils = require("./games_utils");

const api_domain = process.env.api_domain; 
const LEAGUE_ID = process.env.league_ID;

// Get the current season of superliga
var CURRENT_SEASON = null;
const getLeagueSeason = async() => {
    let league = await axios.get(`${api_domain}/leagues/${LEAGUE_ID}`, {
      params: {
        api_token: process.env.api_token,
      },
    });
    
    CURRENT_SEASON = league.data.data.current_season_id;
  }
  
  getLeagueSeason();
  
// Get all the players that play in the team - For teams/teamFullDetails/:teamId
async function getPlayersNames(players_ids_list) {
  try {
    let promises = [];
    players_ids_list.map((id) =>
      promises.push(
        axios.get(`${api_domain}/players/${id}`, {
          params: {
            api_token: process.env.api_token,
          },
        })
      )
    );
    let players_info = await Promise.all(promises);
    let players_name = await extractRelevantPlayerData(players_info)
    return players_name;
  }
  catch {
    throw { status: 404, message: "PlayerID is not exists!" };
  }
}

// Check if team in league
async function checkTeamInLeague(teamID) {
  const team = await axios.get(`${api_domain}/teams/${teamID}`, {
    params: {
      api_token: process.env.api_token,
      include: "league", 
    },
  });
  
  if (team.data.data.league.data.id != LEAGUE_ID && team.data.data.league.data.current_season_id != CURRENT_SEASON)
      throw { status: 404, message: "The team is not part of the Superliga" };  
}

// Get all the data of list of players
function extractRelevantPlayerData(players_info) {
    return players_info.map((player_info) => {
      const { fullname, player_id, image_path} = player_info.data.data;
      return {
        name: fullname,
        playerID: player_id,
        image: image_path
      };
    });
}

// Get all the players that play in the team - For teams/teamFullDetails/:teamId
async function getPlayersByTeam(team_id) {
    let player_ids_list = await players_utils.getPlayerIdsByTeam(team_id);
    let players_info = await getPlayersNames(player_ids_list);
    return players_info;
}

// Get the team name by ID
async function getTeamNameByID(team_id){
  try {
    const team = await axios.get(`${api_domain}/teams/${team_id}`, {
      params: {
        api_token: process.env.api_token,
      },
    });
    return team.data.data.name;
  }
  catch {
    throw { status: 404, message: "TeamID is not exists!"};
  }
}

// Get the team object from API
async function getTeamFromAPI(team_id_list) {
  try {
    let promises = [];
      team_id_list.map((team_id) => {
        promises.push(
          axios.get(`${api_domain}/teams/${team_id}`, {
            params: {
                api_token: process.env.api_token,
                include: "coach, league", 
            },
          })
        )});
      let teams_info = await Promise.all(promises);
      return teams_info;
    }
    catch {
      throw { status: 404, message: "TeamID is not exists!" };
  }
}

// Get all the data about list of teams - For users/favoriteTeams
async function getTeamInfo(team_id_list) {
    let teams_info = await getTeamFromAPI(team_id_list);
    return extractRelevantTeamData(teams_info);
}

// Get all the data about list of teams - For users/favoritesTeam
async function extractRelevantTeamData(teams_info) {
  let data = await Promise.all(teams_info.map(async team => {
    let coach_name = "";
    let team_id = team.data.data.id;
    
    if (team.data.data.coach != null) {
      coach_name = team.data.data.coach.data.fullname;
    }

    if (team.data.data.league.data.id != LEAGUE_ID && team.data.data.league.data.current_season_id != CURRENT_SEASON)
      throw { status: 403, message: "The team is not part of the Superliga" };  

    return {
      teamID: team.data.data.id,
      name: team.data.data.name,
      coach: coach_name,
      players: await getPlayersByTeam(team_id),
    };
  }));
  return data;
}

// Get all the data about list of teams - For TeamPersonalPage (teams/teamFullDetails/:teamID)
async function getTeamFullInfo(teamID) {
  const team = await axios.get(`${api_domain}/teams/${teamID}`, {
    params: {
      api_token: process.env.api_token,
      include: "coach, league", 
    },
  });

  let coach_name = "";
  let coach_image = "";
  let coach_ID = 0;

  if (team.data.data.coach != null){
    coach_name = team.data.data.coach.data.fullname;
    coach_ID = team.data.data.coach.data.coach_id;
    coach_image = team.data.data.coach.data.image_path;
  }

  if (team.data.data.league.data.id != LEAGUE_ID && team.data.data.league.data.current_season_id != CURRENT_SEASON)
      throw { status: 403, message: "The team is not part of the Superliga" };  

  else {
    return {
        name: team.data.data.name,
        future_games: await games_utils.getTeamFutureGames(teamID),
        past_Games: await games_utils.getTeamPastGames(teamID),
        coach: coach_name,
        coachID: coach_ID,
        coach_image: coach_image,
        players: await getPlayersByTeam(teamID),
    };
  }
}

// Return all the teams that plays in the current
async function getAllTeams() {
  let teams_array = await axios.get(`${api_domain}/teams/season/${CURRENT_SEASON}`, {
    params: {
      api_token: process.env.api_token,
    },
  });
``
  teams_array = teams_array.data.data;

  let data = [];
  for (let i = 0; i < teams_array.length; i++){
    let dict = {};
    dict["teamID"] =  teams_array[i].id;
    dict["teamName"] =  teams_array[i].name;

    data.push(dict);
  }

  return data;
}


exports.getAllTeams = getAllTeams;
exports.getTeamFullInfo = getTeamFullInfo;
exports.getTeamInfo = getTeamInfo;
exports.getTeamNameByID = getTeamNameByID;
exports.checkTeamInLeague = checkTeamInLeague;