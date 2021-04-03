import express from 'express';
var router = express.Router();
import { getEvents } from '../google-calander';


/* GET Time Table Day. */
router.get('/gettimetableday', async function (req, res, next) {

	// Get Start and End date for an all-day event today
	let startDate = new Date();
	let endDate = new Date();
	startDate.setDate(startDate.getDate());
	// An all-day event is 1 day (or 86400000 ms) long
	endDate.setDate(new Date(startDate.getTime() + 86400000).getDate());

	// Retrive events from google calander API
	let events = await getEvents(startDate, endDate);


	let dayNumber;
	let error;
	for (let event of events) {
		// Matches events containg day, then captures the number following, (Case insensitive)
		let regexCapture = event["summary"].match(/Day ?(\d{1,2})/mi);
		if (regexCapture) {

			dayNumber = parseInt(regexCapture[1]); // [1] is the capture group around the digits
			console.log("Found Day Number: " + dayNumber);
			console.log(event);
			console.log(dayNumber);
		}
	}
	if (dayNumber === undefined) {
		error = "Day Event Missing from Calander";
	}
	// If the perimeter is undefined, the JSON converter ignores it.
	res.json({ currentDay: dayNumber, error: error, cached: false });

});


module.exports = router;


