var express = require("express");
var router = express.Router();
const coaches_utils = require("./utils/coaches_utils");
const users_utils = require("./utils/users_utils");


// For PersonalPages - Coach
router.get("/coachFullDetails/:coachID", async (req, res, next) => {
  try {
    const coach_details = await coaches_utils.getCoachFullInfo(req.params.coachID);
    res.status(200).send(coach_details);
  } 
  catch (error) {
    next(error);
  }
});

module.exports = router;
