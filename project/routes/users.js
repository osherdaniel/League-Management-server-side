var express = require("express");
var router = express.Router();
const users_utils = require("./utils/users_utils");
const players_utils = require("./utils/players_utils");
const teams_utils = require("./utils/teams_utils");
const games_utils = require("./utils/games_utils");

// Authenticate all incoming requests by middleware
router.use(async function (req, res, next) {
  if (req.session && req.session.userID) {
    users_utils.getAllUsers()
      .then((users) => {
        if (users.find((x) => x.userID === req.session.userID)) {
          req.userID = req.session.userID;
          next();
        }
      })
      .catch((err) => next(err));
  } 
  else {
    res.sendStatus(401);
  }
});

// ---------------------------------------- Add to Favorites ----------------------------------------

// This path gets body with playerID and save this player in the favorites list of the logged-in user
router.post("/favoritePlayers", async (req, res, next) => {
  try {
    const userID = req.session.userID;
    const playerID = req.body.playerID;

    if (userID == undefined || playerID == undefined) throw { status: 400, message: "One of the argument is not specified" };

    let favorite = await users_utils.checkIfInFavoritesPlayers(userID, playerID);
    if(favorite.length != 0)
      res.status(303).send("The player already in favorites team");

    else {
      // Check if the players is in the Superliga
      await players_utils.getPlayerFullInfo(playerID);

      await users_utils.markAsFavorite('FavoritesPlayers', userID, playerID);
      res.status(201).send("The player successfully saved as favorite");
    }
  } 
  catch (error) {
    next(error);
  }
});

// This path gets body with teamID and save this team in the favorites list of the logged-in user
router.post("/favoriteTeams", async (req, res, next) => {
  try {
    const userID = req.session.userID;
    const teamID = req.body.teamID;

    if (userID == undefined || teamID == undefined) 
      throw { status: 400, message: "One of the argument is not specified" };

    let favorite = await users_utils.checkIfInFavoritesTeams(userID, teamID);
    if(favorite.length != 0)
      res.status(303).send("The team already in favorites team");
    
    else {
      // Check if the team is in the Superliga
      await teams_utils.checkTeamInLeague(teamID);

      await users_utils.markAsFavorite('FavoritesTeam', userID, teamID);
      res.status(201).send("The team successfully saved as favorite");
    }
  } 
  catch (error) {
    next(error);
  }
});

// This path gets body with gameID and save this game in the favorites list of the logged-in user
router.post("/favoriteGames", async (req, res, next) => {
  try {
    const userID = req.session.userID;
    const gameID = req.body.gameID;

    if (userID == undefined || gameID == undefined) 
      throw { status: 400, message: "One of the argument is not specified" };

    else {
      let favorite = await users_utils.checkIfInFavoritesGames(userID, gameID);
      if(favorite.length != 0)
        res.status(303).send("The game already in favorites team");
      
      else {
        let flag = await users_utils.checkGameDate(gameID);
        if (flag == false)
          res.status(401).send("The game already accured || The game is not exists");
        else {
          await users_utils.markAsFavorite('FavoritesGames', userID, gameID);
          res.status(201).send("The game successfully saved as favorite");
        }
      }
    }
  } 
  catch (error) {
    next(error);
  }
});

// ---------------------------------------- View ----------------------------------------

// This path get all the favorites players of the logged-in user
router.get("/favoritePlayers", async (req, res, next) => {
  try {
    if (!req.userID) 
      throw { status: 401, message: "Not autorize user!"};
    
    const userID = req.session.userID;

    const player_ids = await users_utils.getFavoritePlayers(userID);

    if (player_ids.length == 0)
      res.status(200).send("No favorites players")
    

    else {
      let player_ids_array = [];
      player_ids.map((element) => player_ids_array.push(element.playerID));
      const results = await players_utils.getPlayersInfo(player_ids_array);
      res.status(200).send(results);
    }
  } 
  catch (error) {
    next(error);
  }
});

// This path get all the favorites teams of the logged-in user
router.get("/favoriteTeams", async (req, res, next) => {
  try {
    if (!req.userID) 
      throw { status: 401, message: "Not autorize user!"};
    
    const userID = req.session.userID;
    const team_ids = await users_utils.getFavoriteTeams(userID);

    if (team_ids.length == 0)
      res.status(200).send("No favorites teams");

    else {
      let team_ids_array = [];
      team_ids.map((element) => team_ids_array.push(element.teamID));
      const results = await teams_utils.getTeamInfo(team_ids_array);
      res.status(200).send(results);
    }
  } 
  catch (error) {
    next(error);
  }
});

// This path get all the favorites games of the logged-in user
router.get("/favoriteGames", async (req, res, next) => {
  try {
    if (!req.userID) 
      throw { status: 401, message: "Not autorize user!"};
    
    const userID = req.session.userID;
    const game_ids = await users_utils.getFavoriteGames(userID);

    if (game_ids.length == 0)
      res.status(200).send("No favorites games");

    else {
      let game_ids_array = [];
      game_ids.map((element) => game_ids_array.push(element.gameID));
      const results = await games_utils.getGameInfo(game_ids_array);
      res.status(200).send(results);
    }
  } 
  catch (error) {
    next(error);
  }
});

module.exports = router;
