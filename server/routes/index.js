import express from 'express';
var router = express.Router();
import getEvents from '../google-calander';


/* GET home page. */
router.get('/gettimetableday', function(req, res, next) {
//   res.render('index', { title: 'Hi I am + My name changes with restart! \n\n My Public IP is '+res.locals.myPublicIp+'. ENV.custom_key='+process.env.custom_key});
// let events = getEvents(int());
// console.log(events);
console.log("2021-10-03T00:00:00.000Z")
	res.json({currentDay: "It worked, retrieval time is " + new Date().toISOString(), cached: false});

});


module.exports = router;


