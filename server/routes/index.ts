import express from 'express';
import { getCurrentTimeTableDay } from '../google-calander';

export let apiRouter = express.Router();

/// {data: ResponseObject, cache_day: DateTime}
let currentDayCache;

/* GET Time Table Day. */
apiRouter.get('/gettimetableday', async function (req, res) {
	// Get Current Date and remove time
	let now = new Date();
	let nowDate = now.toISOString().split("T")[0];

	// Check cache for HIT
	if (currentDayCache !== undefined) {
		console.log("yes", currentDayCache["cache_day"], nowDate)
		if (currentDayCache["cache_day"] == nowDate) {
			console.log("Using Cache");
			let cachedRepsonse = currentDayCache["data"];
			cachedRepsonse["cached"] = true;
			res.json(cachedRepsonse);
			return;
		}
	}

	// Cache MISS, retrive currentDay
	console.log("Cache MISS, retriving fresh data for ",nowDate)
	let response = await getCurrentTimeTableDay();
	currentDayCache = { data: response, cache_day: nowDate };
	console.log("Got data",currentDayCache)
	res.json(response);
});


