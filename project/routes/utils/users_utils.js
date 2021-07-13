const DButils = require("./DButils");

// Mark the object as favorites to user
async function markAsFavorite(table, userID, objectID) {
  await DButils.execQuery(
    `INSERT INTO ${table} values ('${userID}',${objectID})`
  );
}

// Check if the team is in FavoritesTeam
async function checkIfInFavoritesTeams(userID, teamID) {
  const favorite = await DButils.execQuery(
    `select teamID from FavoritesTeam where userID=${userID} and teamID = ${teamID}`
  );
  return favorite;
}

// Check if the team is in FavoritesPlayers
async function checkIfInFavoritesPlayers(userID, playerID) {
  const favorite = await DButils.execQuery(
    `select playerID from FavoritesPlayers where userID=${userID} and playerID = ${playerID}`
  );
  return favorite;
}

// Check if the games is in FavoritesGames
async function checkIfInFavoritesGames(userID, gameID) {
  const favorite = await DButils.execQuery(
    `select gameID from FavoritesGames where userID=${userID} and gameID = ${gameID}`
  );
  return favorite;
}

// Return if the game already accured - Check it when the user try to add the game for favorites
async function checkGameDate(gameID) {
  const game = await DButils.execQuery(
    `select gameID from Games where gameID=${gameID} and game_time > GETDATE()`
  );
  if (game.length == 0)
    return false;
  return true;  
}

// Return the FavoritesPlayers of the user
async function getFavoritePlayers(userID) {
  const playersID = await DButils.execQuery(
    `select playerID from FavoritesPlayers where userID='${userID}'`
  );
  return playersID;
}

// Return the FavoritesTeam of the user
async function getFavoriteTeams(userID) {
  const teamsID = await DButils.execQuery(
    `select teamID from FavoritesTeam where userID='${userID}'`
  );
  return teamsID;
}

// Return the FavoritesGames of the user
async function getFavoriteGames(userID) {
  const gamesID = await DButils.execQuery(
    `select gameID from FavoritesGames where userID='${userID}'`
  );
  return gamesID;
}

// Update favorite games
async function updateFavoriteGames(userID) {
  const games = await DButils.execQuery(
    `DELETE fg 
    FROM FavoritesGames fg 
    INNER JOIN Games game
      ON game.gameID = fg.gameID
    WHERE userID='${userID}' AND game_time <= GETDATE();`
  );
}

async function getAllUsers() {
  const users = await DButils.execQuery(
    `SELECT userID FROM dbo.Users`
  );
  return users;
}

exports.getAllUsers = getAllUsers;
exports.markAsFavorite = markAsFavorite;
exports.getFavoritePlayers = getFavoritePlayers;
exports.getFavoriteTeams = getFavoriteTeams;
exports.getFavoriteGames = getFavoriteGames;
exports.checkGameDate = checkGameDate;
exports.updateFavoriteGames = updateFavoriteGames;
exports.checkIfInFavoritesTeams = checkIfInFavoritesTeams;
exports.checkIfInFavoritesPlayers = checkIfInFavoritesPlayers;
exports.checkIfInFavoritesGames = checkIfInFavoritesGames;

