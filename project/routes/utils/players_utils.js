const axios = require("axios");

const api_domain = process.env.api_domain; 
const LEAGUE_ID = process.env.league_ID;

// Get the current seson of superliga
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

// Get all the players of the team
async function getPlayerIdsByTeam(team_id) {
  try {
    let player_ids_list = [];
    const team = await axios.get(`${api_domain}/teams/${team_id}`, {
      params: {
        include: "squad, league",
        api_token: process.env.api_token,
      },
    });

    if (team.data.data.league.data.id != LEAGUE_ID && team.data.data.league.data.current_season_id != CURRENT_SEASON)
      throw { status: 403, message: "The team is not part of the Superliga" };

    team.data.data.squad.data.map((player) =>
      player_ids_list.push(player.player_id)
    );
    return player_ids_list;
  }
  catch {
    throw { status: 404, message: "TeamID is not exists!" };
  }
}

// Get all details of list of players - For users/favoritePlayers & search/:Name
async function getPlayersInfo(players_ids_list) {
  try {
    let promises = [];
    players_ids_list.map((id) =>
      promises.push(
        axios.get(`${api_domain}/players/${id}`, {
          params: {
            api_token: process.env.api_token,
            include: "team, team.league",
          },
        })
      )
    );
    let players_info = await Promise.all(promises);
    let return_value = await extractRelevantPlayerData(players_info);
    return return_value;
  }
  catch {
    throw { status: 404, message: "PlayerID is not exists!" };
  }
}

// Check if player is apart of the league
function checkLeague(player){
  try{
    if (player.data.data.team.data.league.data.id == LEAGUE_ID && player.data.data.team.data.league.data.current_season_id == CURRENT_SEASON)
      return true;
    else
      return false;
  }  
  catch{
    return false; 
  }
}

// Get all the data of list of players - For users/favoritePlayers
async function extractRelevantPlayerData(players_info) {
  let name = "";
  players_info = players_info.filter(checkLeague);

  let data = await Promise.all(players_info.map((player_info) => 
  {
    if (player_info.data.data.team != null)
      name = player_info.data.data.team.data.name

    return {
      playerID: player_info.data.data.player_id,
      name: player_info.data.data.fullname,
      image: player_info.data.data.image_path,
      position: player_info.data.data.position_id,
      team: name,
    };
  }));
  return data;
}

// Get all the players that playes in a team
async function getPlayersByTeam(team_id) {
  let player_ids_list = await getPlayerIdsByTeam(team_id);
  let players_info = await getPlayersInfo(player_ids_list);
  return players_info;
}

// Get all the data about players - For players/playerFullDetails/:playerID
async function getPlayerFullInfo(playerID) {
  try {
    const player_info = await axios.get(`${api_domain}/players/${playerID}`, {
      params: {
        api_token: process.env.api_token,
        include: "team, team.league",
      },
    });

    let leagueID = player_info.data.data.team.data.league.data.id;
    let current_season = player_info.data.data.team.data.league.data.current_season_id;
    if (leagueID != LEAGUE_ID && current_season != CURRENT_SEASON)
      throw { status: 403, message: "The team is not part of the Superliga" };

    return {
      playerID: player_info.data.data.player_id,
      name: player_info.data.data.fullname,
      image: player_info.data.data.image_path,
      position: player_info.data.data.position_id,
      team_name: player_info.data.data.team.data.name,
      height: player_info.data.data.height,
      weight: player_info.data.data.weight,
      common_name: player_info.data.data.common_name,
      birthdate: player_info.data.data.birthdate,
      birthcountry: player_info.data.data.birthcountry,
      nationality: player_info.data.data.nationality,
    };
  }
  catch {
    throw { status: 404, message: "PlayerID is not exists in Superliga!" };
  }
}

exports.getPlayersByTeam = getPlayersByTeam;
exports.getPlayersInfo = getPlayersInfo;
exports.getPlayerIdsByTeam = getPlayerIdsByTeam;
exports.getPlayerFullInfo = getPlayerFullInfo;
exports.extractRelevantPlayerData = extractRelevantPlayerData;