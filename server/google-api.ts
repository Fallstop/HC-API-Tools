import { google, calendar_v3, sheets_v4 } from 'googleapis';
require('dotenv').config();

import { convertDateToTimePeriodOfDay, convertDateTimeToISODate, BellTimeHash, LunchTimeActivity, APIError, BellTimes, PossibleTimeTableDay } from './mod';

// Provide the required configuration
let CREDENTIALS: { client_email: string; private_key: string; };
let HCDayCalendarId: string;
let HCNoticesCalender: string;
let HCBelltimeSheetID: string;
let HCLunchTimeActivitiesCalender: string;
try {
    CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
    HCDayCalendarId = process.env.HC_DAY_CALENDER;
    HCNoticesCalender = process.env.HC_NOTICES_CALENDER;
    HCBelltimeSheetID = process.env.HC_BELLTIME_SHEET_ID;
    HCLunchTimeActivitiesCalender = process.env.HC_LUNCHTIME_ACTIVITIES_CALENDER;
    console.log("Successfully Parsed Credentials");
} catch {
    console.log("Credentials missing or malformed from .env file (or environment)");
    process.exit(1);
}

// Google calendar API settings
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets.readonly'];
const calendar = google.calendar({ version: "v3" });

const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
);

// Get all the events between two dates
export async function getEvents(dateTimeStart, dateTimeEnd, calendarId): Promise<number | calendar_v3.Schema$Event[]> {

    try {
        let response = await calendar.events.list({
            auth: auth,
            calendarId: calendarId,
            timeMin: dateTimeStart,
            timeMax: dateTimeEnd,
            timeZone: 'Pacific/Auckland',
            fields: 'items(description,end,start,summary)',
        });
        let items = response["data"]["items"];
        return items;
    } catch (error) {
        console.log(`Error at getEvents --> ${error}`);
        return 0;
    }
};

export async function getCurrentTimeTableDay(dateToGet: Date) {
    let [startDate, endDate] = convertDateToTimePeriodOfDay(dateToGet);

    // Retrieve events from google calender API
    let events = await getEvents(startDate, endDate, HCDayCalendarId);
    if (events === 0) {
        return { error: "API Error" };
    }

    let ISODate = convertDateTimeToISODate(dateToGet);

    let possibleEvents: PossibleTimeTableDay[] = [];

    // @ts-ignore
    for (let event of events) {
        // Event must have a Title
        let eventTitle = event["summary"];
        if (eventTitle === undefined) { continue }

        // Matches events containing day, then captures the number following, (Case insensitive)
        let regexCapture = eventTitle.match(/Day ?(\d{1,2})/mi);
        if (regexCapture) {
            // Filter weirdness of day notices from other days
            if (event["start"]["date"] !== ISODate) { continue }

            let dayNumber = parseInt(regexCapture[1]); // [1] is the capture group around the digits
            console.log("Found Day Number: " + dayNumber);
            possibleEvents.push({ dayNumber, eventTitle });
        }
    }

    if (possibleEvents.length === 0) {
        return { isSchoolDay: false, error: false, date: ISODate };
    } else {
        possibleEvents = possibleEvents.sort((a, b) => {
            // For now, score via event summary length. Shortest match is best, most likely to be correct
            return a.eventTitle.length - b.eventTitle.length;
        });
        console.log("Event priority list:", possibleEvents)
        let currentDay = possibleEvents[0].dayNumber;
        return { currentDay, isSchoolDay: true, error: false, date: ISODate };

    }

    // If the perimeter is undefined, res.json ignores it on the other end
}

export async function getDailyNotice(date: Date) {
    let [startDate, endDate] = convertDateToTimePeriodOfDay(date);

    // Retrieve events from google calender API
    let events = await getEvents(startDate, endDate, HCNoticesCalender);
    if (typeof events === "number") {
        return { error: "API Error" };
    }
    
    let isSchoolDay = events.length > 0;

    let noticeText: string = "";

    for (let event of events) {
        if (event["description"] === undefined) { continue }
        noticeText += (noticeText==="" ? "" : "<br>") +  event["description"];
    }
    return { isSchoolDay, noticeText }
}

export async function getLunchtimeActivity(date: Date): Promise<LunchTimeActivity | APIError> {
    let [startDate, endDate] = convertDateToTimePeriodOfDay(date);

    // Retrieve events from google calender API
    let events = await getEvents(startDate, endDate, HCLunchTimeActivitiesCalender);
    if (typeof events === "number") {
        return { error: "API Error" };
    }
    
    let weekDay = null;
    let weekRotation = null;

    for (let event of events) {
        if (event["summary"] === undefined) { continue }
        let regexCapture = event["summary"].match(/(\d)-(\d)/mi);
        if (regexCapture) {
            weekRotation = parseInt(regexCapture[1]);
            weekDay = parseInt(regexCapture[2]);
            console.log(`Found Week Rotation: ${weekRotation} and Week Day: ${weekDay}`);
            break;
        }

    }
    return { weekDay, weekRotation }
}

export async function getBellTimes(): Promise<BellTimes | APIError> {
    console.log("Yes.")
    try {
        const sheets = await google.sheets({ version: 'v4', auth });
        const googleAPIData = await sheets.spreadsheets.values.get({
            spreadsheetId: HCBelltimeSheetID,
            range: 'timeDataAPI',

        })
        let rows = googleAPIData.data.values;
        let bellTimeMap: BellTimeHash = {};
        if (rows.length) {
            // Save Daynumbers as hashmap identifyers
            for (let day of rows[0]) {
                bellTimeMap[day] = []
            }
            rows.shift();
            // Iterate through the list of bell times 
            for (let row of rows) {
                for (var i = 0; i < row.length; i++) {
                    if (row[i] !== "") {
                        bellTimeMap[i].push(row[i])
                    }

                }

            }
            return { belltimes: bellTimeMap };
        } else {
            console.log('No data found.');
            return { belltimes: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } }
        }
    } catch (error) {
        console.log(`Error at getEvents --> ${error}`);
        return { error: error }
    }
};