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
  var studyName = '';
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

            // Hilfsvariable für solutions_blank
            studyName =  solutions[0].study.study_name;

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

  // Ausführung nacheinander (damit alle Daten zum Zusammenbau bereitliegen)
  solutions().then(resolve => {
    csv_sol = resolve;
    return post_questionnaire().then(resolve => {
      questionnaires = resolve;
       return apm().then(resolve => {
         apm = resolve;
          return icaa().then(resolve => {
            icaa = resolve;
  
          // ein Post_Questionnaire pro Teilnehmer
          // Iteration über alle Teinehmer einer Studie
          for(i=0;i<questionnaires.length;i++){

            // Zuordnung der zugehörigen Daten
            if (participants.includes(questionnaires[i].VP_id)){
              continue;
              }
            else {
              participants.push(questionnaires[i].VP_id);

              var apm_aktuell = apm.find(function(element) {
                return element.VP_id == questionnaires[i].VP_id;
              });

              // Abfangen unausgefüllter APM Bögen
                if(apm_aktuell == undefined) {
                  apm_aktuell = [];
                }
               
              var icaa_aktuell = icaa.find(function(element) {
                return element.VP_id == questionnaires[i].VP_id;
              });

              // Abfabgen unausgefüllter ICAA Bögen
                if(icaa_aktuell == undefined) {
                  icaa_aktuell = [];
                }

              var solutions_aktuell = csv_sol.filter(element =>
                element.participant == questionnaires[i].VP_id
              )
              
              // Handhabe nicht-gegebener Lösungen zum creattest - Auffüllen mit leeren Objecten 
                var solution_blank = new Object ({
                  solution: '',
                  unused: '',
                  task: '',
                  group: '',
                  neu: '',                  
                  study: studyName,
                  useful: '',
                  participant: questionnaires[i].VP_id
                })

                while (solutions_aktuell.length < 8) {
                    solutions_aktuell.push(solution_blank);
                }

              // Erstellen eines Datensatzes zu je einem Teinehmer
              var csv = new Object({
                Participant: questionnaires[i].VP_id,
                Age: questionnaires[i].age,
                Gender: questionnaires[i].gender,
                Education_grade: questionnaires[i].education_grade,
                Domain: questionnaires[i].domain,
                German: questionnaires[i].german,
                Dyslexia: questionnaires[i].dyslexia,
                Openness_1: questionnaires[i].statement.interest_arts,
                Openness_2: questionnaires[i].statement.imagination,
                Games_Tetris: questionnaires[i].games.tetris,
                Games_Ubongo: questionnaires[i].games.ubongo,
                Games_Scrabble: questionnaires[i].games.scrabble,
                Email: questionnaires[i].email,
                Code: questionnaires[i].code,
                Future_participant: questionnaires[i].subsequent_questionnaire,
                Competition: questionnaires[i].competition,
                Feedback: questionnaires[i].feedback,
                APM_7: apm_aktuell.APM_7,
                APM_8: apm_aktuell.APM_8,
                APM_9: apm_aktuell.APM_9,
                APM_10: apm_aktuell.APM_10,
                APM_11: apm_aktuell.APM_11,
                APM_12: apm_aktuell.APM_12,
                ICAA_Lit_1: icaa_aktuell.literature.short,
                ICAA_Lit_2: icaa_aktuell.literature.long,
                ICAA_Lit_3: icaa_aktuell.literature.newspaper,
                ICAA_Lit_4: icaa_aktuell.literature.speech,
                ICAA_Lit_5: icaa_aktuell.literature.joke,
                ICAA_Lit_6: icaa_aktuell.literature.blog,
                ICAA_Mus_1: icaa_aktuell.music.own_piece,
                ICAA_Mus_2: icaa_aktuell.music.interpreted_piece,
                ICAA_Mus_3: icaa_aktuell.music.own_melodie,
                ICAA_Mus_4: icaa_aktuell.music.own_rhythm,
                ICAA_Mus_5: icaa_aktuell.music.synthesizer,
                ICAA_Mus_6: icaa_aktuell.music.playlist,
                ICAA_Cra_1: icaa_aktuell.crafts.created_object,
                ICAA_Cra_2: icaa_aktuell.crafts.enhanced_object,
                ICAA_Cra_3: icaa_aktuell.crafts.gift,
                ICAA_Cra_4: icaa_aktuell.crafts.decoration,
                ICAA_Cra_5: icaa_aktuell.crafts.planed_garden,
                ICAA_Cra_6: icaa_aktuell.crafts.created_cloths,
                ICAA_Coo_1: icaa_aktuell.cooking.own_dish,
                ICAA_Coo_2: icaa_aktuell.cooking.presentation,
                ICAA_Coo_3: icaa_aktuell.cooking.cake_decoration,
                ICAA_Coo_4: icaa_aktuell.cooking.food_sculpture,
                ICAA_Coo_5: icaa_aktuell.cooking.recipe,
                ICAA_Coo_6: icaa_aktuell.cooking.drink,
                ICAA_Spo_1: icaa_aktuell.sports.special_skills,
                ICAA_Spo_2: icaa_aktuell.sports.wintersports,
                ICAA_Spo_3: icaa_aktuell.sports.summersports,
                ICAA_Spo_4: icaa_aktuell.sports.martial_arts,
                ICAA_Spo_5: icaa_aktuell.sports.others,
                ICAA_Spo_6: icaa_aktuell.sports.planed_training,
                ICAA_FiA_1: icaa_aktuell.fine_arts.collage,
                ICAA_FiA_2: icaa_aktuell.fine_arts.logo,
                ICAA_FiA_3: icaa_aktuell.fine_arts.building,
                ICAA_FiA_4: icaa_aktuell.fine_arts.painting,
                ICAA_FiA_5: icaa_aktuell.fine_arts.sculpture,
                ICAA_FiA_6: icaa_aktuell.fine_arts.skatch_interior,
                ICAA_PeA_1: icaa_aktuell.performing_arts.theater_role,
                ICAA_PeA_2: icaa_aktuell.performing_arts.puppet_theatre,
                ICAA_PeA_3: icaa_aktuell.performing_arts.new_dance,
                ICAA_PeA_4: icaa_aktuell.performing_arts.interpreted_dance,
                ICAA_PeA_5: icaa_aktuell.performing_arts.video,
                ICAA_PeA_6: icaa_aktuell.performing_arts.animation,
                ICAA_Sci_1: icaa_aktuell.science.written_thesis,
                ICAA_Sci_1: icaa_aktuell.science.own_theory,
                ICAA_Sci_1: icaa_aktuell.science.technically_solved_problem,
                ICAA_Sci_1: icaa_aktuell.science.own_construction,
                ICAA_Sci_1: icaa_aktuell.science.programming,
                ICAA_Sci_1: icaa_aktuell.science.website,
                ICAA_CAch_1: questionnaires[i].creative_achievements.text1,
                ICAA_CAch_2: questionnaires[i].creative_achievements.text2,
                ICAA_CAch_3: questionnaires[i].creative_achievements.text3,

                createst_1_solution: solutions_aktuell[0].solution,
                createst_1_unused: solutions_aktuell[0].unused,
                createst_1_task: solutions_aktuell[0].task,
                createst_1_group_name: solutions_aktuell[0].group,
                createst_1_neu: solutions_aktuell[0].neu,
                createst_1_useful: solutions_aktuell[0].useful,
                createst_1_study_name: solutions_aktuell[0].study,
                createst_1_VP_id: solutions_aktuell[0].participant,

                createst_2_solution: solutions_aktuell[1].solution,
                createst_2_unused: solutions_aktuell[1].unused,
                createst_2_task: solutions_aktuell[1].task,
                createst_2_group_name: solutions_aktuell[1].group,
                createst_2_neu: solutions_aktuell[1].neu,
                createst_2_useful: solutions_aktuell[1].useful,
                createst_2_study_name: solutions_aktuell[1].study,
                createst_2_VP_id: solutions_aktuell[1].participant,

                createst_3_solution: solutions_aktuell[2].solution,
                createst_3_unused: solutions_aktuell[2].unused,
                createst_3_task: solutions_aktuell[2].task,
                createst_3_group_name: solutions_aktuell[2].group,
                createst_3_neu: solutions_aktuell[2].neu,
                createst_3_useful: solutions_aktuell[2].useful,
                createst_3_study_name: solutions_aktuell[2].study,
                createst_3_VP_id: solutions_aktuell[2].participant,

                createst_4_solution: solutions_aktuell[3].solution,
                createst_4_unused: solutions_aktuell[3].unused,
                createst_4_task: solutions_aktuell[3].task,
                createst_4_group_name: solutions_aktuell[3].group,
                createst_4_neu: solutions_aktuell[3].neu,
                createst_4_useful: solutions_aktuell[3].useful,
                createst_4_study_name: solutions_aktuell[3].study,
                createst_4_VP_id: solutions_aktuell[3].participant,

                createst_5_solution: solutions_aktuell[4].solution,
                createst_5_unused: solutions_aktuell[4].unused,
                createst_5_task: solutions_aktuell[4].task,
                createst_5_group_name: solutions_aktuell[4].group,
                createst_5_neu: solutions_aktuell[4].neu,
                createst_5_useful: solutions_aktuell[4].useful,
                createst_5_study_name: solutions_aktuell[4].study,
                createst_5_VP_id: solutions_aktuell[4].participant,

                createst_6_solution: solutions_aktuell[5].solution,
                createst_6_unused: solutions_aktuell[5].unused,
                createst_6_task: solutions_aktuell[5].task,
                createst_6_group_name: solutions_aktuell[5].group,
                createst_6_neu: solutions_aktuell[5].neu,
                createst_6_useful: solutions_aktuell[5].useful,
                createst_6_study_name: solutions_aktuell[5].study,
                createst_6_VP_id: solutions_aktuell[5].participant,

                createst_7_solution: solutions_aktuell[6].solution,
                createst_7_unused: solutions_aktuell[6].unused,
                createst_7_task: solutions_aktuell[6].task,
                createst_7_group_name: solutions_aktuell[6].group_name,
                createst_7_neu: solutions_aktuell[6].neu,
                createst_7_useful: solutions_aktuell[6].useful,
                createst_7_study_name: solutions_aktuell[6].study,
                createst_7_VP_id: solutions_aktuell[6].participant,

                createst_8_solution: solutions_aktuell[7].solution,
                createst_8_unused: solutions_aktuell[7].unused,
                createst_8_task: solutions_aktuell[7].task,
                createst_8_group_name: solutions_aktuell[7].group,
                createst_8_neu: solutions_aktuell[7].neu,
                createst_8_useful: solutions_aktuell[7].useful,
                createst_8_study_name: solutions_aktuell[7].study,
                createst_8_VP_id: solutions_aktuell[7].participant,
            
              });
          
            // Erstellen des gesammten AusgabeArrays
            csv_arr.push(csv);
            }  
          }
          // Senden des json Object zur CSV Ausgabe
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(csv_arr) 
        }, err => next(err));
      }, err => next(err))
    }, err => next(err))
  }, err => next(err))
  .catch(err => next(err));
})

///
//
// var csv = new Object ({
//   participant: questionnaires[i].VP_id,
//   questionnaire: questionnaires[i],
//   APM: apm_aktuell,
//   ICAA: icaa_aktuell,
//   solutions: solutions_aktuell
// }); 
// console.log('csv'+csv)

// csv_arr.push(csv)
// }
  
//   // var jsonexport = require('jsonexport');
//   // jsonexport(csv_arr,function(err, csv){
//   //     if(err) return console.log(err);
//   //     console.log(csv);
//   // });

// console.log('json'+csv_arr)

//
///


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
