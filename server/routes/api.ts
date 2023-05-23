import express from 'express';
export let apiRouter = express.Router();

import { getCurrentTimeTableDay, getDailyNotice, getBellTimes, getLunchtimeActivity } from '../google-api';
import { TimeTableDayHash, convertDateTimeToISODate, sameDay, oapi, LunchTimeActivity, ADMIN_TOKEN } from '../mod';

require('dotenv').config();

const useCache = (process.env.USE_CACHE !== "false");

let currentDayCache: TimeTableDayHash = {};
let dailyNoticeCache: object = null;
let lunchtimeActivityCache: LunchTimeActivity | null = null;

/* GET Time Table Day. */
apiRouter.get('/gettimetableday/:date?', oapi.path({
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
	let dateTimeToGet = new Date(req.params.date);
	if (isNaN(dateTimeToGet.getTime())) {
		dateTimeToGet = new Date();
	}
	console.log(dateTimeToGet)
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

apiRouter.get('/getdailynotice/:date?', oapi.path({
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
apiRouter.get('/getlunchtimeactivity/:date?', oapi.path({
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

apiRouter.get('/getbelltimes/', oapi.path({
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
									"0": { type: "array", items: { type: "string" } },
									"1": { type: "array", items: { type: "string" } },
									"2": { type: "array", items: { type: "string" } },
									"3": { type: "array", items: { type: "string" } },
									"4": { type: "array", items: { type: "string" } },
									"5": { type: "array", items: { type: "string" } },
									"6": { type: "array", items: { type: "string" } }
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

// Takes an ADMIN_TOKEN via a post header

apiRouter.post('/refreshcache/', oapi.path({
	description: 'Update the cache',
		parameters: [
			{
				"in": "header",
				"name": "admintoken",
				"required": true,
				"schema": {
					"type": "string"
				},
			}
		],
	responses: {
		200: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							ok: {
								"type": "boolean",
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
		},
		401: {
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
	console.log(req.headers, ADMIN_TOKEN, req.headers["admin_token"])
	if (req.headers["admintoken"] !== `${process.env.ADMIN_TOKEN}`) {
		return res.status(401).json({ error: "Invalid token" })
	}

	try {
		await refreshInfoCache()
		return res.json({ ok: true })
	}
	catch {
		return res.status(500).json({ error: "Something went wrong" })
	}

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