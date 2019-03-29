var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var Group = require('../models/group').Group
var Task = require('../models/task');
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var fs = require('fs');
var shuffle = require('knuth-shuffle').knuthShuffle;

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

//
// Configuration and Creation of a Study
//
studyRouter.route('/:userId')
.post((req, res, next) => {

  // Auswählen zufälliger Tasks in jeweils gewünschter Anzahl - siehe untern
  fetchRandomTasks(req.body.Tetris_count, req.body.Neue_Wörter_count, (tasks) => {
      //console.log(tasks);
        Study.create({
          study_name: req.body.study_name,
          description: req.body.description,
          study_link: '',
          groups: [],
          tasks: tasks,
          solutions: [],
          user: req.params.userId
        })
        .then((study) => {
          study.groups.push(group = new Group({group_name: req.body.group_name, size: req.body.size,}));
          study.study_link = 'www.TumCreativity/' + req.params.userId + '/' + study._id + '/' + req.body.group_name;
          study.save()
          .then((study) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(study);
          })
          }, (err) => next(err))
        .catch((err) => next(err));
      })
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


// Definition Funktion, die die gewünschte Anzahl an zufälligen Tasks der Typen Tetris und Neue_Wörter aus DB filtert
function fetchRandomTasks(Tetris_count, NeueWörter_count, callback){
  parseInt(Tetris_count, 10);
  parseInt(NeueWörter_count, 10);
  var tasks = [];
  
  // Array mit zufällig ausgewählten Tetris Tasks
  let randomiseTetris = function(Tetris_count){
    return new Promise (function(resolve, reject){
      //Finden aller ids von Tetris Tasks
      Task.find({task_type: 'Tetris'}, { '_id': 1 })
      .then(ids => {
        // shuffle array, as per here  https://github.com/coolaj86/knuth-shuffle
        var arrTetris = shuffle(ids.slice(0))  
        // get only the first numberOfItems of the shuffled array
        arrTetris.splice(Tetris_count, arrTetris.length - Tetris_count);
        //tasks.push(arr);
        resolve(arrTetris)
      })
    })
  }

  // Array mit zufällig ausgewählten Neue Wörter Tasts
  let randomiseNeueWörter = function(NeueWörter_count){
    return new Promise (function(resolve, reject){
      Task.find({task_type: 'Neue_Wörter'}, { '_id': 1 })
      .then(ids => {
        // shuffle array, as per here  https://github.com/coolaj86/knuth-shuffle
        var arrNeueWörter = shuffle(ids.slice(0))  
        // get only the first numberOfItems of the shuffled array
        arrNeueWörter.splice(NeueWörter_count, arrNeueWörter.length - NeueWörter_count);
        //tasks.push(arr);
        resolve(arrNeueWörter)
      })
    })
  }

  //Zusammenführen der beiden Arrays zu einem Array und callback
  randomiseTetris().then(resolve=>{
    tasks = resolve;
    return randomiseNeueWörter().then(resolve=> {
     tasks = tasks.concat(resolve);
      callback(tasks);
    })
  })
}
    

module.exports = studyRouter;