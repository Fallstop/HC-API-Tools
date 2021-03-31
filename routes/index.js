var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hi I am + My name changes with restart! \n\n My Public IP is '+res.locals.myPublicIp+'. ENV.custom_key='+process.env.custom_key});
});

module.exports = router;


