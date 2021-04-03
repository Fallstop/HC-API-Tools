import { google, calendar_v3 } from 'googleapis';
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
export async function getEvents(dateTimeStart, dateTimeEnd): Promise<number | calendar_v3.Schema$Event[]> {

    try {
        let response = await calendar.events.list({
            auth: auth,
            calendarId: calendarId,
            timeMin: dateTimeStart,
            timeMax: dateTimeEnd,
            timeZone: 'Pacific/Auckland'
        });

        let items = response["data"].items;
        return items;
    } catch (error) {
        console.log(`Error at getEvents --> ${error}`);
        return 0;
    }
};

export async function getCurrentTimeTableDay () {
    // Get Start and End date for an all-day event today
	let startDate = new Date();
	let endDate = new Date();
	startDate.setDate(startDate.getDate());
	// An all-day event is 1 day (or 86400000 ms) long
	endDate.setDate(new Date(startDate.getTime() + 86400000).getDate());

	// Retrieve events from google calender API
	let events = await getEvents(startDate, endDate);
    if (events === 0) {
        return { error: "API Error", cached: false };
    }
	let dayNumber;
	let error;
	let isSchoolDay = false;
    console.log("events",events)
    // @ts-ignore
	for (let event of events) {
		// Matches events containing day, then captures the number following, (Case insensitive)
		let regexCapture = event["summary"].match(/Day ?(\d{1,2})/mi);
		if (regexCapture) {

			dayNumber = parseInt(regexCapture[1]); // [1] is the capture group around the digits
			isSchoolDay = true
			console.log("Found Day Number: " + dayNumber);
			console.log(event);
			console.log(dayNumber);
		}
	}
	// If the perimeter is undefined, res.json ignores it on the other end
	return { currentDay: dayNumber, isSchoolDay: isSchoolDay, error: error, cached: false };
}