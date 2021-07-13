const DButils = require("./DButils");

// Check if the type of event entered by the user is correct (For manage_league/addListEventsToGame)
function checkEventType(events_list) {
  var types = ["Goal", "Offsife", "Offense", "RedCard", "YellowCard", "Injury", "Subsitution"];
  for (let i = 0; i < events_list.length; i++){
    if (!types.includes(events_list[i].type))
      throw { status: 404, message: "The type of one of the events or more is incorrect" };
  }
}

// Add new game to the DB - For manage_league/addGame
async function addNewGame(req) {
  let game_time = req.body.game_date + " " + req.body.game_time + ":00:000";
  await DButils.execQuery(
    `INSERT INTO Games (game_time, homeTeamID, awayTeamID, field, refereeID) VALUES
    ('${game_time}', '${req.body.home_team_ID}', '${req.body.away_team_ID}', '${req.body.field}', ${req.body.refereeID})`
  );
}

// Update result of a game - For manage_league/addResultToGame
async function updateResult(req) {
  await DButils.execQuery(
    `Update Games SET home_result = ${req.body.home_result} , away_result = ${req.body.away_result}
    WHERE gameID = ${req.body.gameID}`
  );  
}

// Enter events to a game (For manage_league/addListEventsToGame) //TODO
async function createEvent(req) {
  let events_list = req.body.listEvents;
  let game_date = await getGameDate(req.body.gameID);
  for (let i = 0; i < events_list.length; i++){
      let event_time = game_date + " " + events_list[i].event_time + ":00:000";
      await DButils.execQuery(
          `INSERT INTO Events (gameID, event_time, minute, event_description, type) VALUES
          (${req.body.gameID}, CAST('${event_time}' as DATETIME), ${events_list[i].minute}, '${events_list[i].event_description}', '${events_list[i].type}')`
      );
  }
}

// Enter events to a game (For manage_league/addListEventsToGame)
async function createGameEvent(req, game_date) {  
  let event_time = game_date + " " + req.body.event_time + ":00:000";
    await DButils.execQuery(
        `INSERT INTO Events (gameID, event_time, minute, event_description, type) VALUES
        (${req.body.gameID}, CAST('${event_time}' as DATETIME), ${req.body.minute}, '${req.body.event_description}', '${req.body.type}')`
    );
      
}

// Return the date of the game
async function getGameDate(gameID) {
  const game = await DButils.execQuery(
    `SELECT convert(varchar,game_time,120) as game_time FROM Games
     WHERE gameID = ${gameID}`
  );
  return game[0].game_time.substring(0, 10);
}

// Return all the past game of the team - For teamFullDetails/:teamId
async function pastGames(team_id) {
  const games = await DButils.execQuery(
      `SELECT gameID, refereeID, homeTeamID, awayTeamID, 
       convert(varchar,game_time,120) as game_time,
       home_result, away_result, field FROM Games WHERE game_time<=GETDATE() AND
       (homeTeamID = ${team_id} OR awayTeamID = ${team_id})`
  );
  return games;
}

// Get all the future games of the team - For teamFullDetails/:teamId
async function futureGames(team_id) {
  const games = await DButils.execQuery(
    `SELECT gameID, refereeID, homeTeamID, awayTeamID,
     convert(varchar,game_time,120) as game_time,
     field FROM Games WHERE game_time>GETDATE() AND
     (homeTeamID = ${team_id} OR awayTeamID = ${team_id})`
  );
  return games;
}

// Return all the future game of Superliga - DB (For For league/getLeaguePage)
async function allFutureGames_LeagePage() {
  const games = await DButils.execQuery(
    `SELECT gameID, refereeID, homeTeamID, awayTeamID, 
     convert(varchar,game_time,120) as game_time,
     field FROM Games WHERE game_time>GETDATE()`
  );
  return games;
}

// Return all the past game of Superliga - DB (For For league/getLeaguePage)
async function allPastGames_LeagePage() {
  const games = await DButils.execQuery(
      `SELECT gameID, refereeID, homeTeamID, awayTeamID,
       convert(varchar,game_time,120) as game_time,
       home_result, away_result, field FROM Games WHERE game_time<=GETDATE()`
  );
  return games;
}

// Return all the past game of Superliga  - For league/getLeaguePage
async function getPastGames_LeagePage() {
  let past_games = await allPastGames_LeagePage();
  let games_details = await gamesAllDetails(past_games);
  return games_details;
}

// Return all the future game of Superliga  - For league/getLeaguePage
async function getFurureGames_LeagePage() {
  let future_games = await allFutureGames_LeagePage();
  let games_details = await gamesDetails(future_games);
  return games_details;
}

// Get all past games of a team - For teams/teamFullDetails/:teamId
async function getTeamPastGames(team_id) {
  let past_games = await pastGames(team_id);
  let games_details = await gamesAllDetails(past_games);
  return games_details;
}

// Get all future games of a team - For teams/teamFullDetails/:teamId
async function getTeamFutureGames(team_id) {
  let future_games = await futureGames(team_id);
  let games_details = await gamesAllDetails(future_games);
  return games_details;
}

async function getGameDetails(game){
  let game_date = game.game_time.substring(0, 10);
  let game_time = game.game_time.substring(11, 16);

  game.gameID = game.gameID;
  game.game_date = game_date;
  game.game_time = game_time;

  await delete game['game_tiime'];
  return game;
}

// Get the details of list of games - With events
async function gamesAllDetails(games) {
  for (i = 0; i < games.length; i++) {
    let gameID = games[i].gameID;
    const event_list = await DButils.execQuery(
      `SELECT gameID, 
       convert(varchar,event_time,120) as event_time,
       minute, event_description, type FROM Events WHERE gameID= ${gameID}`
    );

    games[i] = await getGameDetails(games[i]);
    
    for (let j = 0; j < event_list.length; j++) {
      event_list[j].event_date = event_list[j].event_time.substring(0, 10);
      event_list[j].event_time = event_list[j].event_time.substring(11, 16);
    }
    games[i].events = event_list;
  }   
  return games;
}  

// Get the details of list of games - Without events 
//For league/getDetailsLoginUser & manage_league/getAllGames
async function gamesDetails(games) {
  for (i = 0; i < games.length; i++) 
    games[i] = await getGameDetails(games[i]);   
  return games;
} 

// Get next game of the league (271) - For league/getDetails
async function getNextGameOfTheLeague() {
  const games = await DButils.execQuery(
      `SELECT gameID, homeTeamID, awayTeamID, refereeID,
      convert(varchar,game_time,120) as game_time,
      field FROM Games WHERE game_time>GETDATE() ORDER BY game_time ASC`
  );
  
  if (games.length != 0) {
      games[0] = await getGameDetails(games[0]);   

    return games[0];
  }
  return {};
}

// Return the details of a game - DB (For manage_league/addResultToGame)
async function getGame(gameID) {
  const games = await DButils.execQuery(
    `select gameID,homeTeamID, awayTeamID,
     convert(varchar,game_time,120) as game_time,
     refereeID, field  from Games where gameID='${gameID}'`
  );
  let returnGames = await gamesDetails(games);
  return returnGames[0];
}

// Get all games from DB - For manage_league/getAllGames
async function getAllGame() {
  const games = await DButils.execQuery(
    `select gameID, homeTeamID, awayTeamID, 
     convert(varchar,game_time,120) as game_time,
     field, refereeID  from Games`
  );
  let returnGames = await gamesDetails(games);
  return returnGames;
}

// Get referee name from refereeID
async function getRefereeName(refereeID) {
  const referee = await DButils.execQuery(
    `select Users.firsName, Users.lastName from Users,Referees where Users.userID = Referees.userID and Referees.refereeID = ${refereeID}`
  );  
  let full_name = "";
  if (referee[0].length != 0)
    full_name = referee[0].firsName + " " + referee[0].lastName;

  return full_name;
}

// Return all details of list of gamesID - For users/favoriteGames
async function getGameInfo(game_id_list) {
  let promises = [];
  game_id_list.map((gameID) => promises.push(getGame(gameID)));

  let games_info = await Promise.all(promises);
  return games_info;
}

exports.getNextGameOfTheLeague = getNextGameOfTheLeague;
exports.getGameInfo = getGameInfo;
exports.gamesDetails = gamesDetails;
exports.getAllGame = getAllGame;
exports.getGame = getGame;
exports.getTeamPastGames = getTeamPastGames;
exports.getTeamFutureGames = getTeamFutureGames;
exports.getPastGames_LeagePage = getPastGames_LeagePage;
exports.getFurureGames_LeagePage = getFurureGames_LeagePage;
exports.addNewGame = addNewGame;
exports.updateResult = updateResult;
exports.createEvent = createEvent;
exports.checkEventType = checkEventType;
exports.createGameEvent = createGameEvent;