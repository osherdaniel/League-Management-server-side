var express = require("express");
var router = express.Router();
const users_utils = require("../routes/utils/users_utils");
const auth_utils = require("../routes/utils/auth_utils");

const bcrypt = require("bcryptjs");

// -------------------------------   Register  ----------------------------------

router.post("/Register", async (req, res, next) => {
  if (req.userID != undefined) 
    throw { status: 401, message: "User already logged in!" };

  try {
    if (!req.body.userName || !req.body.firstName || !req.body.lastName || !req.body.country || !req.body.password || !req.body.email || !req.body.image) 
      throw { status: 400, message: "Not all reqired argument was given!" };

    let existsUser = await auth_utils.checkUserName(req);
    if(existsUser == false)
      throw { status: 409, message: "Username is already taken" };

    let hash_password = bcrypt.hashSync(
      req.body.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    req.body.password = hash_password;

    await auth_utils.Register(req, hash_password);
    res.status(201).send("User created on site");
  } 
  catch (error) {
    next(error);
  }
});

// -------------------------------   Login  ----------------------------------
router.post("/Login", async (req, res, next) => {
  try {
    if (req.userID != undefined)
     throw { status: 401, message: "User already logged in!"};

    if (!req.body.userName || !req.body.password) 
      throw { status: 400, message: "Not all reqired argument was given!" };

    const user = await auth_utils.getUserFromDB(req.body.userName);
    // check that username exists & the password is correct
    if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    req.session.userID = user.userID;
    res.status(200).send("Login Succeeded!");

    // Update favorite games for the user
    users_utils.updateFavoriteGames(user.userID);
  } 
  catch (error) {
    next(error);
  }
});

// ---------   Logout  -----------
router.post("/Logout", function (req, res) {
  if (req.userID != undefined) {
    req.session.reset();
    res.send({ status: 200, message: "Logout succeeded!" });
  }
  else {
    req.session.reset();
    res.send({ status: 200, message: "There is no logged in user"});
  };
})

module.exports = router;
