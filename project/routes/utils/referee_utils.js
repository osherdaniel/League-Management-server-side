var express = require("express");
const DButils = require("./DButils");
const auth_utils = require("./auth_utils");

// Add referee to our website - For manage_league/addReferee
async function addReferee(req) {
    let user = await auth_utils.getUserFromDB(req.body.user[0].userName);
    await DButils.execQuery(
        `INSERT INTO Referees (userID, training) VALUES (${user.userID}, '${req.body.training}')`
      );
}

// Delete referee to our website - For manage_league/deleteReferee
async function deleteReferee(req) {
  let referee = await checkReferee(req.params.refereeID);

  // Check if referee exists
  if (referee != null){
    await DButils.execQuery(
      `Update Referees set status = 0 where refereeID = ${req.params.refereeID}`
    );
  }
  else
    throw { status: 404, message: "The referee not found!" };
}

// Check if the refereeID exist - For manage_league/addGame
async function checkReferee(refereeID){
  const referee = await DButils.execQuery(
    `SELECT * from Referees WHERE refereeID = ${refereeID} and status = 1`
  );
  return referee[0];
}  

async function getAllReferees(){
  const referees = await DButils.execQuery(
    `SELECT Referees.refereeID, Users.firsName, Users.lastName from Referees,Users
            WHERE Referees.userID = Users.userID and Referees.status = 1`
  );
  return referees;
}  

exports.deleteReferee = deleteReferee;
exports.checkReferee = checkReferee;
exports.addReferee = addReferee;
exports.getAllReferees = getAllReferees;
