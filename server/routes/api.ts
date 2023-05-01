import express from 'express';
export let apiRouter = express.Router();

import { getCurrentTimeTableDay, getDailyNotice, getBellTimes, getLunchtimeActivity } from '../google-api';
import { TimeTableDayHash, convertDateTimeToISODate, sameDay, oapi, LunchTimeActivity } from '../mod';

require('dotenv').config();

const useCache = (process.env.USE_CACHE !== "false");



let currentDayCache: TimeTableDayHash = {};
let dailyNoticeCache: object = null;
let lunchtimeActivityCache: LunchTimeActivity | null = null;

/* GET Time Table Day. */
apiRouter.get('/gettimetableday/:date?', oapi.validPath({
	description: 'Get the timetable day',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							currentDay: { type: "number" },
							isSchoolDay: { type: "boolean" },
							error: { type: "boolean" },
							date: { type: "string" },
						}
					}
				}
			}
		},
		500: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							error: { type: 'string' }
						}
					}
				}
			}
		}
	}
}), async function (req: express.Request, res: express.Response) {
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
	res.json(response).status(response.error ? 500 : 200);
});

apiRouter.get('/getdailynotice/:date?', oapi.validPath({
	description: 'Get the daily notice',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							isSchoolDay: { type: "boolean" },
							noticeText: { type: "string" },
						}
					}
				}
			}
		},
		500: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							error: { type: 'string' }
						}
					}
				}
			}
		}
	}
}), async function (req: express.Request, res: express.Response) {
	if ((typeof req.params.date === "undefined" || sameDay(new Date(req.params.date), new Date())) && dailyNoticeCache !== null) {
		res.json(dailyNoticeCache);
	} else {
		let dateToGet = new Date(req.params.date || new Date());
		let result = await getDailyNotice(dateToGet);
		res.json(result).status(result.error ? 500 : 200);
	}
});
apiRouter.get('/getlunchtimeactivity/:date?',oapi.validPath({
	description: 'Get the lunch-time activity for the day notice',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							weekDay: { type: "number" },
							weekRotation: { type: "number" },
						}
					}
				}
			}
		},
		500: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							error: { type: 'string' }
						}
					}
				}
			}
		}
	}
}), async function (req: express.Request, res: express.Response) {
	if ((typeof req.params.date === "undefined" || sameDay(new Date(req.params.date), new Date())) && lunchtimeActivityCache !== null) {
		res.json(lunchtimeActivityCache);
	} else {
		console.log(req.params.date)
		let dateToGet = new Date(req.params.date || new Date());

		let result = await getLunchtimeActivity(dateToGet);
		res.json(result);
	}
});

apiRouter.get('/getbelltimes/',oapi.validPath({
	description: 'Get belltimes for the day',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							belltimes: {
								"type": "object",
								"properties": {
									"0": {type: "array", items: {type: "string"}},
									"1": {type: "array", items: {type: "string"}},
									"2": {type: "array", items: {type: "string"}},
									"3": {type: "array", items: {type: "string"}},
									"4": {type: "array", items: {type: "string"}},
									"5": {type: "array", items: {type: "string"}},
									"6": {type: "array", items: {type: "string"}}
								}
							 },
						}
					}
				}
			}
		},
		500: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							error: { type: 'string' }
						}
					}
				}
			}
		}
	}
}), async function (req: express.Request, res: express.Response) {
	const response = await getBellTimes();
	res.json(response)
});

async function refreshInfoCache() {
	let dateToGet = new Date();
	console.log("Refreshing notice cache");
	dailyNoticeCache = await getDailyNotice(dateToGet);
	console.log("Refreshing lunchtime cache");
	let newLunchtimeActivity = await getLunchtimeActivity(dateToGet);
	if (!("error" in newLunchtimeActivity)) {
		lunchtimeActivityCache = newLunchtimeActivity;
	}
}

setInterval(refreshInfoCache, 1000 * 60 * 15) // 15 minutes
refreshInfoCache();