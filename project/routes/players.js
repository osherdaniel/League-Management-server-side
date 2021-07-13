var express = require("express");
var router = express.Router();
const players_utils = require("./utils/players_utils");
const users_utils = require("./utils/users_utils");

// Personal Page of player
router.get("/playerFullDetails/:playerID", async (req, res, next) => {
  try {
    const player_details = await players_utils.getPlayerFullInfo(req.params.playerID);

    let favorite = false;
    if (req.session && req.session.userID){
      let inFavorite = await users_utils.checkIfInFavoritesPlayers(req.session.userID, req.params.playerID);  
      if(inFavorite.length == 0)
        favorite = true; 
    }
    player_details.notInFavorite = favorite;

    res.status(200).send(player_details);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
