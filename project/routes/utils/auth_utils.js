const DButils = require("./DButils");

// Register new user to the website
async function Register(req, hash_password) {
    await DButils.execQuery(
        `INSERT INTO Users VALUES ('${req.body.userName}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.country}', '${hash_password}', '${req.body.email}', '${req.body.image}')`
        );
}

// Check if the UserName already exist in the DB - For auth/Register
async function checkUserName(req) {
    const users = await DButils.execQuery("SELECT userName FROM dbo.Users");

    if (users.find((x) => x.userName === req.body.userName))
       return false;
    return true;   
}

// Return the user with 'userName' from DB - For auth/Login
async function getUserFromDB(userName) {
    let user = await DButils.execQuery(
        `SELECT * FROM dbo.Users WHERE userName = '${userName}'`
    );
    return user[0];
}

exports.getUserFromDB = getUserFromDB;  
exports.Register = Register;   
exports.checkUserName = checkUserName;
