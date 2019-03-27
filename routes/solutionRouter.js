var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var mongoose = require('mongoose');
var fs = require('fs');

var Solution = require('../models/solution').Solution;
var SolutionAll = require('../models/solution').SolutionAll;
var User = require('../models/user');
var Task = require('../models/task');

var solutionRouter = express.Router();

solutionRouter.use(bodyParser.json());

//////////////////////////
// Route zu den einzelnen Studien
// Einsehen der Ergebnisse einzelner Studien
// Eingabe der Lösungen eine VP und Speichern in der Datenbank

solutionRouter.route('/:userId/:studyId/:groupId')
.get((req, res, next) => {
    User.findById(req.params.userId)
    .then((user) => {
        console.log(user.studies[0].groups)
    })
})
.post((req, res, next) => {
    //Welcher Aufagabentyp ? 
    Task.findById(req.body.task)
    .then(task => {
        // Im Fall von "Neue_Wörter" alphabetisches Ordnen in einen Array der Lösungswörter
        if (task.task_type == "Neue_Wörter"){
            req.body.solution = req.body.solution.split(', ');
            req.body.solution.sort();
        }
        // Abgleich mit Datenbank Solutions
        Solution.findOne({solution: req.body.solution}) 
        .then((solution) => {
            //console.log('Lösung nach Umformung: ' + solution)
                // Im Fall einer neuen Lösung
                if (!solution) {
                    // Nützlichkeitswert: Funktion "usefulValue" siehe unten !! Reihenfolge wegen asynchroner Programmierung!!
                    usefulValue(req, (useful) => {
                        // Erzeugen eines Eintrages in Solution
                        Solution.create({
                        solution: req.body.solution,
                        unused: req.body.unused,
                        neu: 1,  
                        useful: useful,
                        counter: 1,
                        task: req.body.task
                        })
                        // Rückmeldung über den Erfolg der Aktion
                        .then((solution) => {
                            console.log('New Solution "' + solution.solution + '" saved');
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(solution);

                            //Erzeugen eines Eintrages in SolutionAll
                            SolutionAll.create({
                                solution: solution._id,
                                VP_Id: req.params.ip,
                                study: req.params.studyId,
                                task: solution.task
                            })
                            //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
                            .then(() => {
                                Solution.find({task: req.body.task})
                                .then((solutions) => {
                                        solutions.forEach(function(item, index, array){
                                            //console.log(solution._id);
                                            //console.log(item._id);
                                            if (item._id == solution._id) {
                                                //return;
                                            }
                                            else {
                                                SolutionAll.countDocuments({task: solution.task})
                                                .then((N_max) => {
                                                    item.neu = 1 - (item.counter/N_max);
                                                    console.log(N_max)
                                                    console.log('for solution: ' + item.solution + 
                                                        ': updatet neu value = ' + item.neu);
                                                    item.save();
                                                });
                                            }
                                        }); 
                                }); 
                            });
                        })
                        
                    })
                }    
                else { 
                    // Im Falle einer bereits existierenden Lösung:
                    // Erzeugen eines Eintrages in SolutionAll
                    SolutionAll.create({
                    solution: solution._id,
                    VP_Id: req.params.ip,
                    study: req.params.studyId,
                    task: solution.task
                    })
                    // Aktualisieren der Werte "neu" und "counter" in Solutions und damit auch in SolutionsAll
                    // Funktion "actualizeSolution" siehe unten
                    .then(() => {
                        


                        //console.log('Lösung vor neu updet: ' + solution);
                        actualizeSolution(solution, (solution) => {
                            //Rückmeldung über den Erfolg der Aktion
                            if (!solution) {err = new Error('actualizeSolutioen failed')}
                            else {
                                console.log('Solution "' + solution.solution + '" saved');
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(solution);
                            }
                        });
                    }).catch((err) => next(err));   
                }   
        }).catch((err) => next(err));
    }).catch((err) => next(err));
});

//
// Berechnung des Nützlichkeitswertes
//
// Definition usefulValue
//Definition callback
function usefulValue(req, callback){   
    //Bestimmung der zugehörigen Aufgabe
    Task.findById(req.body.task)
    .then(task => {
        if (!task) {err = new Error('Task identification failed in usefulValue')}
        // Berechnung des Nützlichkeitswertes bei Aufgabe "Neue Wörter"
        else if (task.task_type == "Neue_Wörter") {
            
            

            console.log('solution " ' + req.body.solution + ' " was given');
            var sol = [];
            var wort = [];
            var length = [];
            var länge = 0;
            var useful = 0;
 
            console.log(typeof req.body.solution);
            console.log('Länge req.body.solution: ' + req.body.solution.length);

            for(i=0;i<req.body.solution.length;i++){
                var re = new RegExp('^' + req.body.solution[i] + '$');
                var words = require('an-array-of-english-words');
                var Word = words.filter(word => word.match(re));
                wort.push(Word);
                if (Word == '') {  
                    console.log('Word "' + req.body.solution[i] + '" is not valid');
                }
                else  {
                    sol.push(req.body.solution[i]);
                    length.push(req.body.solution[i].length)
                    länge = länge + req.body.solution[i].length;
                }
            };
            console.log('sol: ' + sol);
            console.log('max: ' + req.body.max);
            console.log('wort: ' + wort);
            console.log('länge: ' + länge);
            // Berechung des Nützlichkeitswertes
            // linear
            useful = länge/req.body.max;

            //Rückgabewert
            callback(useful);
        }

        // Im Fall von Tetris
        else if (task.task_type == "Tetris") {
            // Hilfsvariablen
            var base = []; // für hinterlegte Augafgabe
            var sol = []; // für Lösung
            // Wandeln der hinterlegten Aufgabe von String in Zahlen
            task.task.split(',').forEach(function(item, index, array) {
            item.split(' ').forEach(function(item, index, array) {
                                item = parseInt(item, 10);
                                item = 
                                base.push(item);  
                            });
            }); 
            // Wandeln der Lösung von String in Zahlen
            req.body.solution.split(',').forEach(function(item, index, array) {
            item.split(' ').forEach(function(item, index, array) {
                                item = parseInt(item, 10);
                                sol.push(item);
                            });
            });
            // Berechnen der Summe aus hinterlegter Aufgabe und Lösung
            var ergebnis = [];
            for(i=0;i<base.length;i++) {
                ergebnis[i] = base[i] + sol[i];
            };
            // Zählen der belegten inneren Felder
            var count = 0;
            ergebnis.forEach(function(item, index, array){
                if (item == 3){
                    count = count +1
                }
            });
            // Beziehung: belegete innere Felder/ maximal mögliche Felder
            console.log(count + ' valid fields');
            useful = count/req.body.max;

            //Rückgabewert
            callback(useful);
        }
        else {
            err = new Error('task_type not found');
        }
    });
};

//Berechnung des Neuheitswertes/ Aktuaisieren der Einträge
function actualizeSolution(solution, callback, next) {
    // Erhöhen des Zählers der aktuellen Lösung um eins
    //solution.counter = solution.counter + 1;
    console.log(solution);
    // Zählen aller jemals eingegangenen Lösungen zur aktuellen Aufgabe
    SolutionAll.countDocuments({task: solution.task})
    .then((N_max) => {
        //Aktualisierung des Neuheitswertes dieser Lösung, Berechnung linear
        Solution.findById(solution.id)
        .then(solution => {
            solution.counter = solution.counter + 1;
            solution.neu = 1 - (solution.counter/N_max);
            console.log(N_max);
            console.log(solution)
            solution.save()
            .then(solution => {
                callback(solution)});
        })
        .then(() => {
            //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
            Solution.find({task: solution.task})
            .then((solutions) => {
                    solutions.forEach(function(item, index, array){
                        if(item._id == solution._id){
                            console.log(item._id)
                            return;
                        }
                        else {
                        item.neu = 1 - (item.counter/N_max);
                        console.log('inner ' + N_max);
                        console.log(item.solution + ' : updatet value neu: ' + item.neu);
                        item.save();
                        }
                    }, solutions); 
            })
        })
    })
};

module.exports = solutionRouter;