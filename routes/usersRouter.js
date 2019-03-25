var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var fs = require('fs');

var Study = require('../models/study').Study; 

var router = express.Router();

router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.send('Welcome! Please Register or Log In!');
});

// Register //
router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      passport.authenticate('local')(req, res, () => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Registration Successful!'});
      });
    }
  });
});

// Login //
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, status: 'You are successfully logged in!'});
});

// Logout //
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/users');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

// Access control //
function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  else {
    //res.flash('danger', 'Please Log In!');
    res.redirect('/users/login');
  }
}

function authorizedUser(req, res) {
  User.findOne({username: req.username})
  .then((user)  => {
    if(user){
      //res.flash('danger', 'You are not authorized!');
      res.redirect('/users/login');
    }
    else {
      return next();
    }
  })
}


module.exports = router;
