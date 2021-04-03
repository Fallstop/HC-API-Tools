import { google } from 'googleapis';
require('dotenv').config();

// Provide the required configuration
let CREDENTIALS;
let calendarId;
try {
    CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
    calendarId = process.env.HC_DAY_CALANDER;
    console.log("Successfully Parsed Credentials");
} catch {
    console.log("Credentials missing or malformed from .env file (or environment)");
    process.exit(1);
}


// Google calendar API settings
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const calendar = google.calendar({ version: "v3" });

const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
);


// Get all the events between two dates
export async function getEvents(dateTimeStart, dateTimeEnd) {

    try {
        let response = await calendar.events.list({
            auth: auth,
            calendarId: calendarId,
            timeMin: dateTimeStart,
            timeMax: dateTimeEnd,
            timeZone: 'Pacific/Auckland'
        });

        let items = response["data"]["items"];
        return items;
    } catch (error) {
        console.log(`Error at getEvents --> ${error}`);
        return 0;
    }
};
