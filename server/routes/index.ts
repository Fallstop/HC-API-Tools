import express from 'express';

export let indexRouter = express.Router();

/* Redirect to homepage */
indexRouter.get('/', async function (req, res) {
	res.redirect("https://jmw.nz");
});


