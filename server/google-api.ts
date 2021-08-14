import { google, calendar_v3, sheets_v4 } from 'googleapis';
require('dotenv').config();

import { convertDateToTimePeriodOfDay, convertDateTimeToISODate, BellTimeHash } from './mod';

// Provide the required configuration
let CREDENTIALS;
let HCDayCalendarId;
let HCNoticesCalender;
let HCBeltimeSheetID
try {
    CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
    HCDayCalendarId = process.env.HC_DAY_CALENDER;
    HCNoticesCalender = process.env.HC_NOTICES_CALENDER;
    HCBeltimeSheetID = process.env.HC_BELLTIME_SHEET_ID;
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
            timeZone: 'Pacific/Auckland'
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
    let dayNumber;
    let error = false;
    let isSchoolDay = false;
    // @ts-ignore
    for (let event of events) {
        // Matches events containing day, then captures the number following, (Case insensitive)
        if (event["summary"] === undefined) { continue }
        let regexCapture = event["summary"].match(/Day ?(\d{1,2})/mi);
        if (regexCapture) {
            // Filter weirdness of day notices from other days
            if (event["start"]["date"] !== convertDateTimeToISODate(dateToGet)) { continue }

            dayNumber = parseInt(regexCapture[1]); // [1] is the capture group around the digits
            isSchoolDay = dayNumber != 0
            console.log("Found Day Number: " + dayNumber);
            console.log(event);
            console.log(dayNumber);
        }
    }
    // If the perimeter is undefined, res.json ignores it on the other end
    return { currentDay: dayNumber, isSchoolDay: isSchoolDay, error: error, date: convertDateTimeToISODate(dateToGet) };
}

export async function getDailyNotice(date: Date) {
    let [startDate, endDate] = convertDateToTimePeriodOfDay(date);

    // Retrieve events from google calender API
    let events = await getEvents(startDate, endDate, HCNoticesCalender);
    if (events === 0) {
        return { error: "API Error" };
    }

    let noticeText: string;

    // @ts-ignore
    for (let event of events) {
        // Matches events containing day, then captures the number following, (Case insensitive)
        let regexCapture = event["summary"].match(/daily ?notices/mi);
        if (regexCapture) {
            console.log("Found Match", event)
            noticeText = event["description"]
            return { noticeText: noticeText, isSchoolDay: true };
        }
    }
    return { isSchoolDay: false }
}

export async function getBellTimes(): Promise<Object> {
    console.log("Yes.")
    try {
        const sheets = await google.sheets({ version: 'v4', auth });
        const googleAPIData = await sheets.spreadsheets.values.get({
            spreadsheetId: HCBeltimeSheetID,
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
            return { bellTimeMap: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } }
        }
    } catch (error) {
        console.log(`Error at getEvents --> ${error}`);
        return { error: error }
    }
};