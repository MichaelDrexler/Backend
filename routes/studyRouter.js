var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var Group = require('../models/group').Group
var Task = require('../models/task');
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
  fillUp(req.body.Tetris_count, (tasks) => {
    console.log(tasks)
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
  function fillUp(count, callback){
    
    Task.countDocuments({task_type: 'Tetris'})
    .then(numberItems => {
      var random = [];
      for(i=0;i<count;i++){
        random[i] = Math.floor((Math.random() * numberItems) + 1);
      }
      console.log(random);
      Task.find({task_type: 'Tetris', 'config': {$in:random}})
      .then(tasks => {
        var task_ids = []
        for(i=0;i<tasks.length;i++){
          task_ids[i]=tasks[i]._id;
        }
        callback(task_ids)        
      })
  })
}
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