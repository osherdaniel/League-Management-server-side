
const axios = require("axios");
const players_utils = require("./players_utils");

const api_domain = process.env.api_domain; 
const LEAGUE_ID = process.env.league_ID;

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

async function search(search_params){
  let teams_array = await axios.get(`${api_domain}/teams/season/${CURRENT_SEASON}`, {
    params: {
      api_token: process.env.api_token,
      include: "coach",
    },
  });
  
  teams_array = teams_array.data.data;
  let coaches = [];
  let players = [];
  let teams = [];

  for (let i = 0; i < teams_array.length; i++){
    // Search Coach
    let coach = teams_array[i].coach.data;
    if (coach.fullname != null && coach.fullname.includes(search_params)){
      coach.team_name = teams_array[i].name;
      coaches.push(coach);
    }

    // Search Team
    if (teams_array[i].name != null && teams_array[i].name.includes(search_params)){
      coach.team_name = teams_array[i].name;
      teams.push(
      {
        teamID: teams_array[i].id,
        name: teams_array[i].name,
        logo_path: teams_array[i].logo_path
      });
    }

    // Search Players
    let teamPlayers = await players_utils.getPlayersByTeam(teams_array[i].id);
    for (let j = 0; j < teamPlayers.length; j++){
      let player = teamPlayers[j];
      if (player.name != null && player.name.includes(search_params))
        players.push(player);
    }
  }

  let return_coaches = await Promise.all(coaches.map(async (coach) => {
    return {
      coachID: coach.coach_id,
      firsName: coach.firstname,
      lastName: coach.lastname,
      team_name: coach.team_name,
      image: coach.image_path
    };
  }));

  return {
    players: players,
    teams: teams,
    coaches: return_coaches,
  };
}

exports.search = search;