var express = require("express");
var router = express.Router();
const teams_utils = require("./utils/teams_utils");
const users_utils = require("./utils/users_utils");

// Personal Page of team
router.get("/teamFullDetails/:teamId", async (req, res, next) => {
  try {
    const team_details = await teams_utils.getTeamFullInfo(req.params.teamId);

    let favorite = false;
    if (req.session && req.session.userID){
      let inFavorite = await users_utils.checkIfInFavoritesTeams(req.session.userID, req.params.teamId);  
      if(inFavorite.length == 0)
        favorite = true; 
    }
    
    team_details.notInFavorite = favorite;
    
    for (i = 0; i < team_details.future_games.length; i++) {
      let gameID = team_details.future_games[i].gameID;

      let favorite = false;
      if (req.session && req.session.userID){
        let inFavorite = await users_utils.checkIfInFavoritesGames(req.session.userID, gameID);
        if(inFavorite.length == 0)
          favorite = true; 
      }
      team_details.future_games[i].notInFavorite = favorite;
    }
    res.status(200).send(team_details);
  } 
  catch (error) {
    next(error);
  }
});

// Get all teams in the system
router.get("/getTeams/", async (req, res, next) => {
  try {
    let teams = await teams_utils.getAllTeams();
    if (teams.length == 0)
      res.status(204).send("There is no teams in the system");
    
    res.status(200).send(teams);
  } 
  catch (error) {
    next(error);
  }
});

module.exports = router;
