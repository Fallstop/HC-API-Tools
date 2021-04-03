import express from 'express';
import { getCurrentTimeTableDay, getDailyNotice } from '../google-calander';

export let apiRouter = express.Router();

require('dotenv').config();

const useCache = (process.env.NODE_ENV == "production");

let currentDayCache: { data: Object, cache_day: String; };

/* GET Time Table Day. */
apiRouter.get('/gettimetableday', async function (req: express.Request, res: express.Response) {
	// Get Current Date and remove time
	let now = new Date();
	let nowDate = now.toISOString().split("T")[0];

	// Check cache for HIT
	if (currentDayCache !== undefined && useCache) {
		console.log("yes", currentDayCache["cache_day"], nowDate);
		if (currentDayCache["cache_day"] == nowDate) {
			console.log("Using Cache");
			let cachedResponse = currentDayCache["data"];
			cachedResponse["cached"] = true;
			res.json(cachedResponse);
			return;
		}
	}

	// Cache MISS, retrieving currentDay
	console.log("Cache MISS, retrying fresh data for ", nowDate);
	let response = await getCurrentTimeTableDay();
	currentDayCache = { data: response, cache_day: nowDate };
	console.log("Got data", currentDayCache);
	res.json(response);
});

apiRouter.get('/getdailynotice/:date?', async function (req: express.Request, res: express.Response) {
	let dateToGet = new Date(req.params.date || new Date());
	console.log(dateToGet);
	let result = await getDailyNotice(dateToGet);
	res.json(result);
});

