var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require("passport");

var indexRouter = require('./routes/index');
var userRouter = require("./routes/userRouter");
var studyRouter = require('./routes/studyRouter');
var solutionRouter = require('./routes/solutionRouter');
// über diese Route können vorhandene Tasks in Datenbank eingepflegt werden
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

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./configuration/passport")(passport);

// Routes
app.use("/users", userRouter);
app.use('/', indexRouter);
app.use('/study', studyRouter);
app.use('/insertTasks', insertTaskRouter);

// Anlegen einer Session für Zuordnung einer Lösung zu einer Versuchsperson
app.use(session({
  name: 'VP',
  secret: 'visitacion31',
  //cookie:{expires: new Date(Date.now()+1*3600*1000)},
  resave: false,
  saveUninitialized: true,
  store: new FileStore()
}));
app.use('/solution', solutionRouter);

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
