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
var SolutionAll = require('../models/solution').SolutionAll;

var studyRouter = express.Router();

studyRouter.use(bodyParser.json());

// User Page with Studies
studyRouter.route('/:userId')
.get((req, res, next) => {
  User.findById(req.params.userId)
  .populate({
    path:     'studies',			
    populate: { path:  'tasks',
          model: 'Task' }})
    .then(user => {
      console.log(user);
    // Ausgabe der aller gesamten Studien mit Tasks
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json')
    res.json(user.studies);

    // oder aufbereitet
    // Aufbereiten der Daten - Senden nur der Variablen "study_name" und der Objecte "groups"
      /*var studies = [];
      for (i = 0; i < user.studies.length; i ++){
          studies[i] = new Object({study_name: user.studies[i].study_name, groups: user.studies[i].groups});
      };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json')
      res.json(studies);*/
  },(err) => next(err))
  .catch((err) => next(err)); 
})
//
// Configuration and Creation of a Study
//
.post((req, res, next) => {
  // Auswählen zufälliger Tasks in jeweils gewünschter Anzahl - siehe untern
  fetchRandomTasks(req.body.Tetris_count, req.body.Neue_Wörter_count, (tasks) => {
      //console.log(tasks);
        Study.create({
          study_name: req.body.study_name,
          description: req.body.description,
          study_link: [],
          groups: [],
          tasks: tasks,
          user: req.params.userId
        })
        .then((study) => {
          req.body.groups.forEach(function(item){
            study.groups.push(item);
          });
          req.body.groups.forEach(function(item){
            study.study_link.push('www.creativity.lfe.mw.tum/' + study._id + '/' + item.group_name);
          });
          study.save()
          .then((study) => {
            
            User.findById(req.params.userId)
            .then((user) => {
              user.studies.push(study._id);
              user.save();
            }, (err) => next(err))
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(study);
          })
          }, (err) => next(err))
        .catch((err) => next(err));
      })
})

// Access of solutions of a certain Study
studyRouter.route('/:userId/:studyId')
.get((req, res, next) => {
    SolutionAll.find({study: req.params.studyId})
    .populate('solution')
    .then((solutions) => {
        // Senden der gesamten Lösungen
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(solutions)

        // Aufbereiten der Daten - Senden nur der Lösung und der Werte "neu" und "useful"
        /*lsg = [];
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
        res.json(lsg)*/
    }, err => next(err))
    .catch(err => next(err));
})

//Alteration of a certain Study Name
.put((req, res, next) => {
  // Check, if study obtained already one solution
  SolutionAll.findOne({study: req.params.studyId})
  .populate('study')
  .then(solution => {
    if (solution) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json('It`s not allowed to change study "' + solution.study.study_name + '". There are already solutions given');
    }
    else {
      var old_study_name = req.body.study_name;
      Study.findById(req.params.studyId)
      .then(study => {
        // Auswählen zufälliger Tasks in jeweils gewünschter Anzahl - siehe untern
        fetchRandomTasks(req.body.Tetris_count, req.body.Neue_Wörter_count, (tasks) => {
        // Zuweisen der neuen Werte
        study.study_name = req.body.study_name,
        study.description = req.body.description,
        study.study_link = [],
        study.groups = [],
        study.tasks = tasks,
        study.user = req.params.userId
      
        // Befüllen der Arrays "groups" und "study_link"
        req.body.groups.forEach(function(item){
          study.groups.push(item);
        });
        req.body.groups.forEach(function(item){
          study.study_link.push('www.creativity.lfe.mw.tum/' + study._id + '/' + item.group_name);
        });

        // Speicher der Änderungen
        study.save()
        
        // Ausgabe der geänderten Studie
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json('Study "' + old_study_name + '" changed to: ' + study);
        })
      }, err => next(err))
    }
  }, (err) => next(err))
  .catch((err) => next(err));
})

// Deletion of a certain Study
.delete((req, res, next) => {
  Study.findByIdAndDelete(req.params.studyId)
  .then((study) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.send({success: true, status: 'Study ' + study.study_name + ' deleted!'});
  }, err => next(err))
  .catch((err) => next(err));
});

// Definition Funktion, die die gewünschte Anzahl an zufälligen Tasks der Typen Tetris und Neue_Wörter aus DB filtert
function fetchRandomTasks(Tetris_count, NeueWörter_count, callback){
  parseInt(Tetris_count, 10);
  parseInt(NeueWörter_count, 10);
  var tasks = [];
  
  // Array mit zufällig ausgewählten Tetris Tasks
  let randomiseTetris = function(Tetris_count){
    console.log(Tetris_count)
    return new Promise (function(resolve, reject){
      //Finden aller ids von Tetris Tasks
      Task.find({task_type: 'Tetris'}, { '_id': 1 })
      .then(ids => {
        // shuffle array, as per here  https://github.com/coolaj86/knuth-shuffle
        var arrTetris = shuffle(ids.slice(0)); 
        // get only the first numberOfItems of the shuffled array
        arrTetris.splice(Tetris_count, arrTetris.length - Tetris_count);
        // give result back
        resolve(arrTetris);
      })
    })
  }

  // Array mit zufällig ausgewählten Neue Wörter Tasts
  let randomiseNeueWörter = function(NeueWörter_count){
    console.log(NeueWörter_count)
    return new Promise (function(resolve, reject){
      Task.find({task_type: 'Neue_Wörter'}, { '_id': 1 })
      .then(ids => {
        // shuffle array, as per here  https://github.com/coolaj86/knuth-shuffle
        var arrNeueWörter = shuffle(ids.slice(0)) 
        // get only the first numberOfItems of the shuffled array
        arrNeueWörter.splice(NeueWörter_count, arrNeueWörter.length - NeueWörter_count);
        // give result back
        resolve(arrNeueWörter);
      })
    })
  }

  //Zusammenführen der beiden Arrays zu einem Array und callback
  randomiseTetris(Tetris_count).then(resolve=>{
    tasks = resolve;
    return randomiseNeueWörter(NeueWörter_count).then(resolve=> {
    tasks = tasks.concat(resolve);
      callback(tasks);
    })
  })
}
    

module.exports = studyRouter;


// Versuch für put-method
/*Study.findById(req.params.studyId)
      .then((study) => {
        fetchRandomTasks(req.body.Tetris_count, req.body.Neue_Wörter_count, (tasks) => {
          console.log('task: ' + tasks);
          if (req.body.study_name == undefined){
            //return
            console.log('study_name not changed')
          }
          else {
            console.log(study);
            study.study_name = req.body.study_name;
          }

          if (req.body.description == undefined) {
            //return
            console.log('description not changed')
          }
          else {
            study.description = req.body.description;
          }

          if (req.body.open == study.open){
            // return
            console.log('open not changed')
          }
          else {
            study.open = req.body.open;
          }

          if (req.body.study_link == null) {
            return
          }
          else {
            study.study_link = [];
            req.body.groups.forEach(function(item){
              study.study_link.push('www.creativity.lfe.mw.tum/' + study._id + '/' + item.group_name);
            });
          }

          if (tasks == undefined)
            return
          else{
              study.tasks = tasks;
          }

          if (req.body.groups == null) {
            return
          }
          else {
            study.groups = [];
            req.body.groups.forEach(function(item){
              study.groups.push(item);
            });
          }*/