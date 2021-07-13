var express = require("express");
const axios = require("axios");
var router = express.Router();
const DButils = require("./utils/DButils");
const games_utils = require("./utils/games_utils");
const league_utils = require("./utils/league_utils");
const referee_utils = require("./utils/referee_utils");
const users_utils = require("./utils/users_utils");
const teams_utils = require("./utils/teams_utils");

// Get all referees in the system
router.get("/getReferees/", async (req, res, next) => {
  try {
    let referees = await referee_utils.getAllReferees();
    if (referees.length == 0)
      res.status(204).send("There is no referees in the system");
    
    res.status(200).send(referees);
  } 
  catch (error) {
    next(error);
  }
});

// Authenticate all incoming requests by middleware
router.use(async function (req, res, next) {
  if (req.session && req.session.userID && req.session.userID == 154) {
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

// Get all games of the league by Association Representative 
router.get("/getAllGames", async (req, res, next) => {
    try {
      const games = await games_utils.getAllGame();
      res.status(200).send(games);
    } catch (error) {
      next(error);
    }
});

// Add new game to the league by Association Representative
router.post("/addGame", async (req, res, next) => {
    try {
      if (!req.body.game_time || !req.body.home_team_ID || !req.body.away_team_ID || !req.body.field || !req.body.refereeID)
        throw { status: 400, message: "Not all reqired argument was given!" };
      
      let referee = await referee_utils.checkReferee(req.body.refereeID);
      if (!referee)
        throw { status: 404, message: "RefereeID is not exist!" };

      // Check the date of the game
      let game_time_string = req.body.game_date + " " + req.body.game_time + ":00:000";
      var dateParts = game_time_string.split("-");
      var jsDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2].substr(0,2), dateParts[2].substr(3,2), dateParts[2].substr(6,2), 0, 0);

      let current_time = new Date();
      if (jsDate < current_time)
        throw { status: 404, message: "The game already accured!" };  

      // Check if the two teams is in the league
      await teams_utils.checkTeamInLeague(req.body.home_team_ID);
      await teams_utils.checkTeamInLeague(req.body.away_team_ID);
      
      await games_utils.addNewGame(req);
    
      res.status(201).send("Game created on site");
    } 
    catch (error) {
      next(error);
    }
});

// Update result to a game by Association Representative
router.put("/addResultToGame", async (req, res, next) => {
    try {
      if (!req.body.gameID || !req.body.home_result || !req.body.away_result)
        throw { status: 400, message: "Not all reqired argument was given!" };
 
      if (req.body.home_result  < 0|| req.body.away_result < 0)
        throw { status: 400, message: "Result of the game cant be lower than zero" };

      let game = await games_utils.getGame(req.body.gameID);
      if (game.length == 0)
        throw { status: 404, message: "GameID is not exists!" };
      
      let game_time_string = game.game_date + " " + game.game_time + ":00:000";  
      var dateParts = game_time_string.split("-");
      var jsDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2].substr(0,2), dateParts[2].substr(3,2), dateParts[2].substr(6,2), 0, 0);

      let current_time = new Date();
      if (jsDate > current_time)
        throw { status: 404, message: "The game has not yet been played" };    
        
      else {
        await games_utils.updateResult(req);
        res.status(200).send("Game result where update!");
      }
    } 
    catch (error) {
      next(error);
    }
});

// Add list of events to a game by Association Representative
router.post("/addListEventsToGame", async (req, res, next) => {
    try {
      if (!req.body.gameID || !req.body.listEvents)
        throw { status: 400, message: "Not all reqired argument was given!" };

      for (let i = 0; i < req.body.listEvents.length; i++){
        let event = req.body.listEvents[i];
        if (event.event_time == null|| event.minute == null|| event.event_description == null|| event.type == null)
          throw { status: 400, message: "Not all reqired argument was given!" };

        if (event.minute < 0|| event.event_description == '')
          throw { status: 400, message: "The parameters entered for the duration of the event description game are not good" };  
      }

      games_utils.checkEventType(req.body.listEvents);

      let game = await games_utils.getGame(req.body.gameID);
      if (game.length == 0)
        throw { status: 404, message: "GameID is not exists!" };

      // Check the date of the game
      let game_time_string = game.game_date + " " + game.game_time + ":00:000";  
      var dateParts = game_time_string.split("-");
      var jsDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2].substr(0,2), dateParts[2].substr(3,2), dateParts[2].substr(6,2), 0, 0);

      let current_time = new Date();
      if (jsDate > current_time)
        throw { status: 404, message: "The game has not yet been played" };  

      await games_utils.createEvent(req);
      res.status(201).send("Game events where update!");
    } 
    catch (error) {
      next(error);
    }
});

// Add referee to the league by Association Representative
router.post("/addReferee", async (req, res, next) => {
  try {
    if (!req.body.user[0].userName || !req.body.user[0].firstName || !req.body.user[0].lastName || !req.body.user[0].country || !req.body.user[0].password || !req.body.user[0].email || !req.body.user[0].image || !req.body.training) 
      throw { status: 400, message: "Not all reqired argument was given!" };

    var flag = true;

    try {
      const user = await axios({
        method: 'POST',
        url: 'http://localhost:3000/Register',
        data: {
          userName: req.body.user[0].userName,
          firstName: req.body.user[0].firstName,
          lastName: req.body.user[0].lastName,
          country: req.body.user[0].country,
          password: req.body.user[0].password,
          email: req.body.user[0].email, 
          image: req.body.user[0].image,
        }
      });
    }
    catch (err){
      res.status(409).send("Username is already taken");
    }

    if (flag) {
      await referee_utils.addReferee(req);
      res.status(201).send("New Refere added");
    }
  } 
  catch (error) {
    next(error);
  }
});

// Remove referee from the league by Association Representative
router.delete("/removeReferee/:refereeID", async (req, res, next) => {
  try {
    await referee_utils.deleteReferee(req);
    res.status(200).send("The referee was removed!");
  } 
  catch (error) {
    next(error);
  }
});

module.exports = router;
