import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';


import { apiRouter } from './routes/api';
import { indexRouter } from './routes/index';

var app = express();

app.use(cors());
app.use(logger('dev'));

app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );


app.use('/api', apiRouter);
app.use('/',indexRouter)


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 400);
  res.json({ internalError: err.message });
});

export default app;
