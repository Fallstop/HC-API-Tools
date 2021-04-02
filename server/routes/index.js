import express from 'express';
var router = express.Router();
import { getEvents } from '../google-calander';


/* GET Time Table Day. */
router.get('/gettimetableday', async function(req, res, next) {
	let events = await getEvents("2021-01-03T00:00:00.000Z","2021-10-03T00:00:00.000Z");
	console.log(events)
	res.json({currentDay: "It worked, retrieval time is " + new Date().toISOString(), cached: false});

});


module.exports = router;


