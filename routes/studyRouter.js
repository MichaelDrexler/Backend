var express = require('express');
var bodyParser = require('body-parser');
var shuffle = require('knuth-shuffle').knuthShuffle;
var passport = require('passport');

var User = require('../models/user');
var Task = require('../models/task');
var Study = require('../models/study').Study; 
var SolutionAll = require('../models/solution').SolutionAll;
var Solution = require('../models/solution').Solution;
var Post_Questionnaire = require('../models/Post_Questionnaire');
var APM = require('../models/APM');
var ICAA = require('../models/ICAA');

var studyRouter = express.Router();

studyRouter.use(bodyParser.json());

//
// Ausgabe der Studien (ohne Lösungen und Tasks) und zugehörigen Teilnehmenern
studyRouter.route('/:userId')
.get(/*passport.authenticate('jwt', { session: false }),*/ (req, res, next) => {
    Study.find({user: req.params.userId})
    .populate({
      path: 'solutions',			
      populate: { path: 'solution',
                  model: 'Solution'
                }})            
    .then(studies => {
      studies_view = [];
      let loop = function(){
        return new Promise(function(resolve){
          for (i=0;i<studies.length;i++){
            var study_view = new Object;
            var neu_mean = 0;
            var useful_mean = 0;
            var participants = [];
            var participants_count = 0;
            var different_solutions = [];
      
            for (j=0;j<studies[i].solutions.length;j++) {
              if (participants.includes(studies[i].solutions[j].VP_id)){
                continue
              }
              else {
                participants.push((studies[i].solutions[j].VP_id))
              }
            }

            for (l=0;l<studies[i].solutions.length;l++){
              if (different_solutions.includes(studies[i].solutions[l].solution)){
                continue;
              }
              else {
                different_solutions.push(studies[i].solutions[l].solution);
                neu_mean = neu_mean + studies[i].solutions[l].solution.neu;
                useful_mean = useful_mean + studies[i].solutions[l].solution.useful;
              }
            }  

            neu_mean = neu_mean/different_solutions.length;
            useful_mean = useful_mean/different_solutions.length;
            creative_mean = (neu_mean + useful_mean)/2;
            participants_count = participants.length;
                  
            // Schreiben der Ergebnisse in ein Objekt
            study_view.study = studies[i];
            study_view.neu_mean = (Math.round(neu_mean*100))/100;
            study_view.useful_mean = (Math.round(useful_mean*100))/100;
            study_view.creative_mean = (Math.round(creative_mean*100))/100;
            study_view.participants = participants;
            study_view.participants_count = participants_count;
            studies_view.push(study_view);
        }
        resolve();
      })
    }

    loop().then(() => {
      // Senden der gesamten Lösungen
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(studies_view);
    }, err => next(err))
  }, err => next(err))
  .catch(err => next(err));
})

//
// Anlegen einer Studie
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
              user.save()
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

//
// Ausgabe einer bestimmten Studie
studyRouter.route('/:userId/:studyId')
.get(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
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
    let loop = function(){
      return new Promise(function(resolve){
        for (i=0;i<study.groups.length;i++){
          var neu_mean = 0;
          var useful_mean = 0;
          var groupSolutions = [];
          var different_solutions =[];
          var participants = [];

          for(j=0;j<study.solutions.length;j++){
              if (study.solutions[j].group.equals(study.groups[i]._id)){
                study.solutions[j].group_name = study.groups[i].group_name;
                groupSolutions.push(study.solutions[j]);
              }
              else{
                continue;
              }
            } 
            
          for (l=0;l<groupSolutions.length;l++){
            if (different_solutions.includes(groupSolutions[l].solution)){
              continue;
            }
            else {
              different_solutions.push(groupSolutions[l].solution);
              neu_mean = neu_mean + groupSolutions[l].solution.neu;
              useful_mean = useful_mean + groupSolutions[l].solution.useful;
            }
          }
              
          for (k=0;k<groupSolutions.length;k++){
            if (participants.includes(groupSolutions[k].VP_id)){
              continue;
            }
            else {
              participants.push(groupSolutions[k].VP_id)
            }
            
          } 
    
          neu_mean = neu_mean/different_solutions.length;
          useful_mean = useful_mean/different_solutions.length;
          creative_mean = (neu_mean + useful_mean)/2;   
          study.groups[i].neu_mean = (Math.round(neu_mean*100))/100;
          study.groups[i].useful_mean = (Math.round(useful_mean*100))/100;
          study.groups[i].creative_mean = (Math.round(creative_mean*100))/100;
          study.groups[i].participants_count = participants.length; 
    
        }
        resolve();
      })
    }
              
    loop().then(() => {
      // Senden der gesamten Lösungen
        console.log('send')
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(study)      
      }, err => next(err))
  }, err => next(err))
  .catch(err => next(err));
})

//
// Ändern einer Studie
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
        fetchRandomTasks(req.body.Tetris_count, req.body.Neue_Wörter_count, (tasks) => {
          // Kettung der einzelnen Bausteine der Studie
          // Befüllen des Array groups
          let fillUpGroups = function(study){
            return new Promise(function(resolve, reject){
              study.groups = [];
              study.save();
              groups = [];
              req.body.groups.forEach(function(item){
                groups.push(item);
              });
              resolve(groups);
            })
          }
        
          // Studie erstellen und speichern
          let putStudy = function(study, groups){
            return new Promise(function(resolve, reject){
                study.study_name = req.body.study_name;
                study.description = req.body.description;
                study.study_link = [];
                study.groups = groups;
                study.tasks = tasks;
                study.solutions = [];
                study.user = req.params.userId;
                resolve(study);
                study.save();
              }, err => next(err));
          };
      
          // Befüllen des Arrays study_link mit den zuvor angelegten group._id s 
          let fillUpLink = function(study){
            return new Promise(function(resolve, reject){
              study.groups.forEach(function(item){
                study.study_link.push('www.creativity.lfe.mw.tum/' + study._id + '/' + item._id);
              //console.log(item)
              });
              resolve(study);
            })
          }
      
          // Reihenfolge festlegen, study._id in User schreiben und Studie ausgeben
          fillUpGroups(study).then(resolve => {
            return putStudy(study, resolve).then(resolve => {
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
          }, err => next(err));
        });
      }, err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));     
})

//
// Löschen einer Studie
.delete(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
  User.findById(req.params.userId)
  .then(user => {
    for(i=0;i<user.studies.length;i++){
      if(user.studies[i]._id == req.params.studyId){
        user.studies.splice(i, 1);
        user.save();
      } 
      else{
        continue;
      } 
    }
  }, err => next(err));

  SolutionAll.find({study: req.params.studyId})
  .then(solutions => {
    for(i=0;i<solutions.length;i++){
      solutions[i].study = undefined;
      solutions[i].group = undefined;
      solutions[i].save();
    }
  }, err => next(err));

  Study.findByIdAndDelete(req.params.studyId)
  .then((study) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.send({success: true, status: 'Study deleted!'});
  }, err => next(err))  
  .catch((err) => next(err));
});

//
// Schließen einer Studie - open auf "false" setzen
studyRouter.route('/:userId/:studyId/close')
.put(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {
  Study.findById(req.params.studyId)
  .then(study => {
    if (study.open == true){
      study.open = false;
      // study.open = req.body.open
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


// Ausgabe der Lösungen für das Herunterladen als csv_Daten
studyRouter.route('/:userId/:studyId/download')
.get(/*passport.authenticate('jwt', { session: false }),*/(req, res, next) => {

  var participants = [];
  var csv_arr = [];
  var csv_sol = [];
  var questionnaires = [];
  // Auslesen aller benötigten Daten zu einer Studie
  //
  // Alle Lösungen zu einer Studie
  let solutions = function(){
    return new Promise(function(resolve){
      SolutionAll.find({'study':  req.params.studyId })
      .populate('solution')  
      .populate('study')  
      .then(solutions => {
        for (i=0;i<solutions.length;i++){
            for (j=0;j<solutions[i].study.groups.length;j++){
              if (solutions[i].group.equals(solutions[i].study.groups[j]._id)){
                var group_name = solutions[i].study.groups[j].group_name;
              }
              else {
                continue
              }
            }

            solution = new Object({
              solution: solutions[i].solution.solution.join(' '),
              unused: solutions[i].solution.unused,
              task: solutions[i].solution.task,
              group: group_name,
              neu: solutions[i].solution.neu,
              useful: solutions[i].solution.useful,
              study: solutions[i].study.study_name,
              participant: solutions[i].VP_id
            });

            csv_sol.push(solution);
        }
        resolve(csv_sol);
      }, err => next(err));
    })
  };

  // Daten zu Versuchspersonen
  let post_questionnaire = function(){
    return new Promise(function(resolve){
      Post_Questionnaire.find()
      .then(questionnaires => {
        resolve(questionnaires);
      })
    })
  };

  // Daten zum APM
  let apm = function(){
    return new Promise(function(resolve){
      APM.find()
      .then(apm => {
        resolve(apm);
      })
    })
  };

  // Daten zu ICAA
  let icaa = function(){
      return new Promise(function(resolve){
        ICAA.find()
        .then(icaa => {
          resolve(icaa);
        })
      })
    };

  solutions().then(resolve => {
    csv_sol = resolve;
    return post_questionnaire().then(resolve => {
      questionnaires = resolve;
       return apm().then(resolve => {
         apm = resolve;
          return icaa().then(resolve => {
            icaa = resolve;
  
          for(i=0;i<questionnaires.length;i++){
            if (participants.includes(questionnaires[i].VP_id)){
              continue;
              }
            else {
              participants.push(questionnaires[i].VP_id);

              var apm_aktuell = apm.find(function(element) {
                return element.VP_id == questionnaires[i].VP_id;
              });

              var icaa_aktuell = icaa.find(function(element) {
                return element.VP_id == questionnaires[i].VP_id;
              });

              var solutions_aktuell = csv_sol.filter(element =>
                element.participant == questionnaires[i].VP_id
                )

              var csv = new Object({
                participant: questionnaires[i].VP_id,
                Post_Questionnaire: questionnaires[i],
                APM: apm_aktuell,
                ICAA : icaa_aktuell,
                createst: solutions_aktuell
                });

              csv_arr.push(csv)
            }     
          }

          //console.log(participants)
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(csv_arr) 
        }, err => next(err));
      }, err => next(err))
    }, err => next(err))
  }, err => next(err))
  .catch(err => next(err));
})

//
// Definition Funktion, die die gewünschte Anzahl an zufälligen Tasks der Typen Tetris und Neue_Wörter aus DB filtert
function fetchRandomTasks(Tetris_count, NeueWörter_count, callback){
  parseInt(Tetris_count, 10);
  parseInt(NeueWörter_count, 10);
  var tasks = [];
  
  // Array mit zufällig ausgewählten Tetris Tasks
  let randomiseTetris = function(Tetris_count){
    //console.log(Tetris_count)
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
    //console.log(NeueWörter_count)
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