const axios = require("axios");
const api_domain = process.env.api_domain; 
const LEAGUE_ID = process.env.league_ID;

// Get the season of the superliga
var CURRENT_SEASON = null;
const getLeagueSeason = async() => {
    let league = await axios.get(`${api_domain}/leagues/${LEAGUE_ID}`, {
      params: {
        api_token: process.env.api_token,
      },
    });
    
    CURRENT_SEASON = league.data.data.current_season_id;
  }
  
  getLeagueSeason();

// For PersonalPages - Get full details of the coach (For - coach/coachFullDetails/:coachID)
async function getCoachFullInfo(coachID) {
    try {
        const coach =  await axios.get(`${api_domain}/coaches/${coachID}`, {
            params: {
            api_token: process.env.api_token,
            },
        });
        
        return {
          coachID: coach.data.data.coach_id,
          name: coach.data.data.fullname,
          image: coach.data.data.image_path,
          teamID: coach.data.data.team_id,
          common_name: coach.data.data.common_name,
          birthdate: coach.data.data.birthdate,
          birthcountry: coach.data.data.birthcountry,
          nationality: coach.data.data.nationality,
      };
    }
    catch {
        throw { status: 404, message: "CoachID is not exists in Superliga!" };
    }
  }
  
exports.getCoachFullInfo = getCoachFullInfo;
