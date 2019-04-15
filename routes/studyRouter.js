var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var Task = require('../models/task');
var passport = require('passport');
var shuffle = require('knuth-shuffle').knuthShuffle;

var Study = require('../models/study').Study; 
var SolutionAll = require('../models/solution').SolutionAll;

var studyRouter = express.Router();

studyRouter.use(bodyParser.json());

// User Page with Studies
studyRouter.route('/:userId')
.get(/*passport.authenticate('jwt', { session: false }), */(req, res, next) => {
  var studies_view = [];

    Study.find({user: req.params.userId})
    .populate('solutions')/*{
      path: ,			
      populate: { path: 'solution',
                  model: 'SolutionAll'
                }})*/
    .then(studies => {
       console.log(studies);

    for(i=0;i<studies.length;i++){
      var study_view = new Object;
      var participants = [];
      var participants_count = 0;
      for (j=0;j<studies[i].solutions.length;j++) {
        if (participants.includes(studies[i].solutions[j].VP_Id)){
          continue
        }
        else {
          participants.push(studies[i].solutions[j].VP_Id)
        }
      }  
      
      participants_count = participants.length;

      study_view.study = studies[i];
      study_view.participants = participants;
      study_view.participants_count = participants_count

      studies_view.push(study_view)
      }
    }, err => next(err)).then(()=>{
       // Senden der gesamten Lösungen
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(studies_view);
    }, err => next(err))
    .catch(err => next(err));
})

//
// Configuration and Creation of a Study
//
.post(/*passport.authenticate('jwt', { session: false }),*/ (req, res, next) => {
  // Auswählen zufälliger Tasks in jeweils gewünschter Anzahl - siehe untern
  fetchRandomTasks(req.body.Tetris_count, req.body.Neue_Wörter_count, (tasks) => {
    // Kettung der einzelnen Bausteine der Studie
    // Befüllen des Array groups
    let fillUpGroups = function(){
      return new Promise(function(resolve, reject){
        var groups = [];
        req.body.groups.forEach(function(item){
          groups.push(item);
        });
        resolve(groups);
      })
    }
   
    // Studie erstellen und speichern
    let createStudy = function(groups){
      return new Promise(function(resolve, reject){
        Study.create({
          study_name: req.body.study_name,
          description: req.body.description,
          study_link: [],
          groups: groups,
          tasks: tasks,
          solutions: [],
          user: req.params.userId
        })
        .then(study => {
          resolve(study)
        }, err => next(err));
      })
    };

    // Befüllen des Arrays study_link mit den zuvor angelegten group._id s 
    let fillUpLink = function(study){
      return new Promise(function(resolve, reject){
        study.groups.forEach(function(item){
          study.study_link.push('www.creativity.lfe.mw.tum/' + study._id + '/' + item._id);
        console.log(item)
        });
        resolve(study);
      })
    }

    // Reihenfolge festlegen, study._id in User schreiben und Studie ausgeben
    fillUpGroups().then(resolve => {
      return createStudy(resolve).then(resolve => {
        return fillUpLink(resolve).then(resolve => {
          resolve.save();
          User.findById(req.params.userId)
            .then((user) => {
              user.studies.push(resolve._id);
              user.save();
            }, (err) => next(err))
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(resolve);
        }, err => next(err));
      }, err => next(err));
    }, err => next(err))
    .catch(err => next(err));
  })
})

// Access of solutions of a certain Study
studyRouter.route('/:userId/:studyId')
.get(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
  var study_view = new Object;

        Study.findById(req.params.studyId)
        .populate({
          path: 'solutions',			
          populate: { path: 'solution',
                      model: 'Solution'
                    }})
        .populate({
          path: 'solutions',
          populate: {
                      path: 'task',
                      model: 'Task'
                    }})
        .populate('tasks')
        .then(study => {
          // mean neu useful groupwise
            var participants = [];
            var participants_count = 0;
            var neu_mean = 0;
            var useful_mean = 0;
            for (i=0;i<study.solutions.length;i++) {
              neu_mean = neu_mean + study.solutions[i].solution.neu;
              useful_mean = useful_mean + study.solutions[i].solution.useful;

              if (participants.includes(study.solutions[i].VP_Id)){
                continue
              }
              else {
                participants.push(study.solutions[i].VP_Id)
              }
            }  
            
            participants_count = participants.length;

            study_view.study = study;
            study_view.neu_mean = neu_mean/study.solutions.length;
            study_view.useful_mean = useful_mean/study.solutions.length;
            study_view.creative_mean = (neu_mean/study.solutions.length+useful_mean/study.solutions.length)/2;
            study_view.participants = participants;
            study_view.participants_count = participants_count;        
      }, err => next(err))
      .then (() => {
        // Senden der gesamten Lösungen
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(study_view)      
      }, err => next(err))
    .catch(err => next(err));
})

//Alteration of a certain Study Name
.put(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
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
          study.study_link.push('www.creativity.lfe.mw.tum/' + study._id + '/' + item.group_name/*Group id*/);
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
.delete(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
  Study.findByIdAndDelete(req.params.studyId)
  .then((study) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.send({success: true, status: 'Study ' + study.study_name + ' deleted!'});
  }, err => next(err))
  .catch((err) => next(err));
});

// Schließen einer Studie
studyRouter.route('/:userId/:studyId/close')
.put(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
  Study.findById(req.params.studyId)
  .then(study => {
    if (study.open == true){
      study.open = false;
      // study.open = req,body.open
      study.save();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.send({success: true, status: 'Study ' + study.study_name + ' changed to closed'});
    }
    else if (study.open == false){
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.send({success: true, status: 'Study ' + study.study_name + ' already closed'});
    }
  }, err => next(err))
  .catch(err => next(err));
  
})


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