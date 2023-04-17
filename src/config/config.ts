import dotenv from 'dotenv';

dotenv.config();


const TWILIO = {
    serviceID: process.env.TWILIO_SERVICE_ID,
    accoundSID: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
}



const config= {
    
    twilio: TWILIO,
    
};



export default config;