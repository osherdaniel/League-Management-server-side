const e = require("express");
var express = require("express");
var router = express.Router();
const league_utils = require("./utils/league_utils");
const users_utils = require("./utils/users_utils");

// For logged in user, show the 3 next game in favorites
router.get("/futureGamesHomePage", async (req, res, next) => {
  try {
    if (req.session && req.session.userID) {
      users_utils.getAllUsers()
        .then((users) => {
          if (users.find((x) => x.userID === req.session.userID)) {
            req.userID = req.session.userID;
          }
        })
    }
    let right_column  = {};
    if (req.userID != null) 
      right_column = await league_utils.futureFavoritesGames(req.session.userID);
    
    res.status(200).send(right_column);
  } 
  catch (error) {
    next(error);
  }
});

// HomePage
router.get("/LeagueInfo", async (req, res, next) => {
  try {
    const league_info = await league_utils.getLeagueDetails();
    res.status(200).send(league_info);
  } 
  catch (error) {
    next(error);
  }
});

// Get league page (9)
router.get("/LeaguePage", async (req, res, next) => {
  try {
    const games = await league_utils.getLeaguePage();

    for (i = 0; i < games.future_games.length; i++) {
      let gameID = games.future_games[i].gameID;

      let favorite = false;
      if (req.session && req.session.userID){
        let inFavorite = await users_utils.checkIfInFavoritesGames(req.session.userID, gameID);
        if(inFavorite.length == 0)
          favorite = true; 
      }
      games.future_games[i].notInFavorite = favorite;
    }

    res.status(200).send(games);
  } 
  catch (error) {
    next(error);
  }
});


module.exports = router;
