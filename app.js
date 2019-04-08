var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var authenticate = require('./authenticate')
var nodemailer = require('nodemailer');
var flash = require('connect-flash');
var fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/usersRouter');
var solutionRouter = require('./routes/solutionRouter');
var studyRouter = require('./routes/studyRouter');

var insertTaskRouter = require('./routes/insertTaskRouter');

//Connection zu Datenbank und ODM mongoose
const mongoose = require('mongoose');
const url = 'mongodb://localhost:27017/kreativDB';
const connect = mongoose.connect(url, { useNewUrlParser: true });

connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });


//App
var app = express(); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  name: 'session-id',
  secret: '12345-67890-09876-54321',
  saveUninitialized: true,
  resave: false,
  store: new FileStore(),
  expires: Date.now() + ((3600)*1000)
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/solution', solutionRouter);
app.use('/study', studyRouter);

app.use('/insertTasks', insertTaskRouter);



//LogIn Barrier
function auth (req, res, next) {

  if (!req.user) {
    var err = new Error('You are not authenticated!');
    err.status = 403;
    next(err);
  }
  else {
        next();
  }
}

app.use(auth);

//app.use(express.static(path.join(__dirname, 'public')));
//app.use('/study', studyRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
