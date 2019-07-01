var express = require('express');
var bodyParser = require('body-parser');

var usefulValue = require('./usefulValue');
var Solution = require('../models/solution').Solution;
var SolutionAll = require('../models/solution').SolutionAll;
var Task = require('../models/task');
var Study = require('../models/study').Study;

var solutionRouter = express.Router();

solutionRouter.use(bodyParser.json());

//////////////////////////
// Route zu den einzelnen Studien
// Einsehen der Ergebnisse einzelner Studien
// Eingabe der Lösungen eine VP und Speichern in der Datenbank

solutionRouter.route('/:studyId/:groupId')
.get((req, res, next) => {
    //res.cookie({ maxAge: 900000, httpOnly: true })
    // Senden der Tasks, die zur jeweiligen Studie gehören
    Study.findById(req.params.studyId)
    .populate('tasks')
    .then((study) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(study.tasks);
    }, (err) => next(err))
    .catch(err => next(err));
})

.post((req, res, next) => {
    //Welcher Aufagabentyp ? 
    Task.findById(req.body.task)
    .then(task => {
        // Im Fall von "Neue_Wörter" alphabetisches Ordnen in einen Array der Lösungswörter
        if (task.task_type == "Neue_Wörter"){
            req.body.solution = req.body.solution.split(',');
            req.body.solution.sort();
        }
        // Abgleich mit Datenbank Solutions
        Solution.findOne({$and: [{solution: req.body.solution},{task: req.body.task}]}) 
        .then((solution) => {
            // Im Fall einer neuen Lösung
            if (!solution) {
                // Nützlichkeitswert: Funktion "usefulValue" siehe unten !! Reihenfolge wegen asynchroner Programmierung!!
                usefulValue(req, next, (useful) => {
                    // Erzeugen eines Eintrages in Solution
                    Solution.create({
                    solution: req.body.solution,
                    unused: req.body.unused,
                    neu: 1,  
                    useful: useful,
                    counter: 1,
                    task: req.body.task
                    })
                    .then((solution) => {
                        //Erzeugen eines Eintrages in SolutionAll
                        let createSolutionAll = function(){
                            return new Promise(function(resolve, reject){
                                SolutionAll.create({
                                solution: solution._id,
                                VP_id: req.sessionID,
                                study: req.params.studyId,
                                task: solution.task,
                                group: req.params.groupId
                                }).then((solution)=> {
                                    Study.findById(req.params.studyId)
                                    .then(study => {
                                        study.solutions.push(solution._id)
                                        study.save();
                                        resolve();
                                    }, err => next(err)) 
                                }, err => next(err))
                            }) 
                        }
                        //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
                        //Reihenfolge beachten!! Eintragen in Solutions und SolutionsAll muss vor updateNeu beendet sein
                        createSolutionAll().then(()=>{
                            updateNeu(solution, req.body)
                        }).then(() => {
                            // Rückmeldung
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(solution);
                        }, err => next(err));
                    }, err => next(err));
                })
            }    
            else { 
                // Im Falle einer bereits existierenden Lösung:
                // Erzeugen eines Eintrages in SolutionAll
                SolutionAll.create({
                solution: solution._id,
                VP_id: req.sessionID,
                study: req.params.studyId,
                task: solution.task,
                group: req.params.groupId
                })
                .then((solution) => {
                    // Referenz in Study anlegen
                    Study.findById(req.params.studyId)
                    .then(study => {
                            study.solutions.push(solution._id);
                            study.save();
                    }, err => next(err)) 
            
                    // Aktualisieren der Werte "neu" und "counter" in Solutions und damit auch in SolutionsAll
                    // Funktion "actualizeSolution" siehe unten
                    actualizeSolutions(solution, req.body, (solution) => {
                        //Rückmeldung über den Erfolg der Aktion
                        if (!solution) {
                            err = new Error('solution ' + req.body.solution + ' could not be actualized');
                            err.status = 404;
                            return next(err);}
                        else {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(solution);
                        }
                    },err => next(err));
                }, err => next(err)); 
            } 
        }, err => next(err))
    }).catch((err) => next(err));
});



// Aktualisiert in Solutions den Neuheitswert der anderen Lösungen bei neuer Lösung 
let updateNeu = function(solution, body){
    // Zählen aller Einträge zu aktuellem Task in SolutionsAll
    SolutionAll.countDocuments({task: body.task})
    .then((N_max) => {
        // Ausgeben aller Einträgezu aktuellem Task und Aktualisieren des Neuheitswertes
        Solution.find({$and:[{'task': body.task}/*, {'_id':{$ne: solution._id}}*/]})
        .then((solutions) => {
            if(solutions != null && N_max != 1) {
                solutions.forEach(function(item){
                    // Berechnung des neuen Neuartigkeitswert
                    item.neu = 1 - item.counter/N_max;
                    // Runden auf fünf Nachkommastellen
                    item.neu = Math.round((item.neu*100))/100;
                    // Speichern des neuen Wertes
                    item.save();
                })
            }
            else {
                return;
            } 
        })
    })
} 

//Berechnung des Neuheitswertes/ Aktuaisieren der Einträge
function actualizeSolutions(solution, body, callback, next) {
    // Erhöhen des Zählers der aktuellen Lösung um eins
    //solution.counter = solution.counter + 1;
    //console.log(solution);
    // Zählen aller jemals eingegangenen Lösungen zur aktuellen Aufgabe
    SolutionAll.countDocuments({task: solution.task})
    .then((N_max) => {
        //Aktualisierung des Neuheitswertes dieser Lösung, Berechnung linear
        Solution.findById(solution.solution /*ref in SolutionsALl*/)
        .then(solution => {
            solution.counter = solution.counter + 1;
            solution.neu = 1 - (solution.counter/N_max);
            // Runden auf fünf Nachkommastellen
            solution.neu = (Math.round(solution.neu*100))/100;
            // Speichern
            solution.save()
            .then(solution => {
                callback(solution)});
        })
        //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
        Solution.find({$and:[{'task': body.task}, {'_id':{$ne: solution.solution}}]})
        .then((solutions) => {
            if(solutions != null && N_max != 1) {
                solutions.forEach(function(item){
                    // Berechnung des neuen Neuartigkeitswertes
                    item.neu = 1 - item.counter/N_max;
                    // Runden auf fünf Nachkommastellen
                    item.neu = Math.round(item.neu*100);
                    item.neu = item.neu/100;
                    item.save();
                })
            }
            else {
                return;
            } 
        })
    })
};

module.exports = solutionRouter;