var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var fs = require('fs');

var Study = require('../models/study').Study; 

var studyRouter = express.Router();

studyRouter.use(bodyParser.json());

// User Page with Studies
studyRouter.route('/:userId')
.get((req, res, next) => {
  User.findById(req.params.userId)
  .then((user) => {
          var studies = [];
          for (i = 0; i < user.studies.length; i ++){
             studies[i] = new Object({studyName: user.studies[i].name});
          };
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json')
          res.json(studies);
  },(err) => next(err))
  .catch((err) => next(err)); 
  //"New Study"-btn guides to a form for specifying the new Study
});

// Access of solutions of a certain Study
studyRouter.route('/:userId/:studyId')
.get((req, res, next) => {
    SolutionAll.find({study: req.params.studyId})
    .populate('solution')
    .then((solutions) => {
        lsg = [];
        for(i = 0; i < solutions.length; i ++){
            var solution = new Object({
                solution: solutions[i].solution.solution,
                neu: solutions[i].solution.neu,
                useful: solutions[i].solution.useful
        });
        lsg[i] = solution;
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(lsg)
    });
})
// Configuration and Creation of a Study
studyRouter.route('/:userId')
.post((req, res, next) => {
  User.findById(req.params.userId)
  .then((user) => {
    if(!user){
      var error = new Error ('User not found')
    }
    else {
    var study = new Study({
      name: req.body.name,
      description: req.body.description,
       
      tasks: [Tetris],
      user: user._id
    });
    user.studies.push(study);
    user.save()
    // create link and send created study
      .then((user) => {
          user.studies[user.studies.length - 1].link = 'www.Creativity.tum/study/' + user._id + '/' 
              + user.studies[user.studies.length - 1]._id;
          user.save();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.studies[user.studies.length - 1]);
      }, (err) => next(err))
    }
  }).catch((err) => next(err))
})
// Deletion of a certain Study
.delete((req, res, next) => {
  User.findById(req.params.userId)
  .then((user) => {
    var StudyName = user.studies.id(req.params.studyId).name;
    user.studies.id(req.params.studyId).remove();
    user.save()
    .then((user) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.send('Study ' + StudyName + ' deleted');
    }).catch((err) => next(err));
  }).catch((err) => next(err));
})
//Alteration of a certain Study Name
.put((req, res, next) => {
  User.findById(req.params.userId)
  .then((user) => {
    // not existig Study not handeled due to impossibility to access not existing things
    var StudyName = user.studies.id(req.params.studyId).name;
    user.studies.id(req.params.studyId).name = req.body.name;
    user.save()
    .then((user) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.send('Study Name changed to ' + StudyName);
    }).catch((err) => next(err));
  }).catch((err) => next(err));
});

module.exports = studyRouter;