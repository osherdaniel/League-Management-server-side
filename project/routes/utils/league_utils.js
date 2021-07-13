const axios = require("axios");
const DButils = require("./DButils");
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

// Get the details of the Superliga - For league/getDetails
async function getLeagueDetails() {

  const league = await axios.get(
    `${api_domain}/leagues/${LEAGUE_ID}`,
    {
      params: {
        include: "season",
        api_token: process.env.api_token,
      },
    }
  );
  let name = "";
  if (league.data.data.current_stage_id != null){
    const stage = await axios.get(
      `${api_domain}/stages/${league.data.data.current_stage_id}`,
      {
        params: {
          api_token: process.env.api_token,
        },
      }
    );
    name = stage.data.data.name;  
  }
  else {
    let stage = await axios.get(`${api_domain}/stages/season/${CURRENT_SEASON}`, {
      params: {
        api_token: process.env.api_token,
      },
    });
    name = stage.data.data[0].name;  
  } 
  return {
    league_name: league.data.data.name,
    current_season_name: league.data.data.season.data.name,
    current_stage_name: name,
    next_game: await games_utils.getNextGameOfTheLeague(),
  };
}

// The function displays the following three favorite games of users - For league/getDetailsLoginUser
async function futureFavoritesGames(userID) {
  const games = await DButils.execQuery(
    `SELECT TOP 3 Games.gameID, Games.homeTeamID, Games.awayTeamID,
     convert(varchar,Games.game_time,120) as game_time,
     Games.field, Games.refereeID FROM Games, FavoritesGames WHERE Games.game_time>GETDATE() AND
     Games.GameID = FavoritesGames.GameID AND FavoritesGames.userID = ${userID} ORDER BY Games.game_time ASC`
  ); 
  return games_utils.gamesDetails(games);
}

// League page - For league/getLeaguePage
async function getLeaguePage() {  
  return {
    past_games: await games_utils.getPastGames_LeagePage(),
    future_games: await games_utils.getFurureGames_LeagePage(),
  };
}

exports.getLeagueDetails = getLeagueDetails;
exports.futureFavoritesGames = futureFavoritesGames;
exports.getLeaguePage = getLeaguePage;
