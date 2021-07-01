import express from 'express';
export let apiRouter = express.Router();

import { getCurrentTimeTableDay, getDailyNotice, getBellTimes } from '../google-api';
import { TimeTableDayHash, convertDateTimeToISODate } from '../mod';

require('dotenv').config();

const useCache = (process.env.USE_CACHE !== "false");



let currentDayCache: TimeTableDayHash = {};

/* GET Time Table Day. */
apiRouter.get('/gettimetableday/:date?', async function (req: express.Request, res: express.Response) {
	let dateTimeToGet = new Date(req.params.date || Date.now());
	// Get Current Date and remove time
	let dateToGet: string = convertDateTimeToISODate(dateTimeToGet);
	// Check cache for HIT
	if (currentDayCache[dateToGet] !== undefined && useCache) {
		console.log("Using Cache");
		let cachedResponse = currentDayCache[dateToGet];
		res.json(cachedResponse);
		return;
	}

	// Cache MISS, retrieving currentDay
	console.log("Cache MISS, retrying fresh data for ", dateToGet);
	let response = await getCurrentTimeTableDay(dateTimeToGet);
	if (!response.error) {
		currentDayCache[dateToGet] = response;
	}
	res.json(response);
});

apiRouter.get('/getdailynotice/:date?', async function (req: express.Request, res: express.Response) {
	let dateToGet = new Date(req.params.date || new Date());
	let result = await getDailyNotice(dateToGet);
	res.json(result);
});

apiRouter.get('/getbelltimes/', async function (req: express.Request, res: express.Response) {
	const response: Object = await getBellTimes();
	res.json(response)
});