/*var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var fs = require('fs');
var authenticate = require('../authenticate');*/

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../configuration/keys");

// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

// Load User model
const User = require("../models/user");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation

const { errors, isValid } = validateRegisterInput(req.body);

// Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } 

const newUser = new User({
        email: req.body.email,
        password: req.body.password
      });

// Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    });
});


// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation

const { errors, isValid } = validateLoginInput(req.body);

// Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

const email = req.body.email;
  const password = req.body.password;

// Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

// Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id
        };

// Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});


/*var Study = require('../models/study').Study; 

var router = express.Router();

router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.send('Welcome! Please Register or Log In!');
});

// Register //
router.post('/signup', (req, res, next) => {
  User.register(new User({email: req.body.email}), 
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

  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
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
}*/


module.exports = router;
