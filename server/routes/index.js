import express from 'express';
var router = express.Router();
import { getCurrentTimeTableDay } from '../google-calander';

require('dotenv').config();

/// {data: ResponseObject, cache_day: DateTime}
let currentDayCache;

const useCache = (process.env.NODE_ENV == "production");

/* GET Time Table Day. */
router.get('/gettimetableday', async function (req, res) {
	// Get Current Date and remove time
	let now = new Date();
	let nowDate = now.toISOString().split("T")[0];

	// Check cache for HIT
	if (currentDayCache !== undefined && useCache) {
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


module.exports = router;


