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
.post((req, res, next) => {
    if (req.body.task == 'Neue Wörter') {
    // Alphabetisches Sortieren der Lösungswörter und Buchstaben
    req.body.solution = req.body.solution.split(', ');
    req.body.solution.sort();
    }
    else{
        //Abgleich mit der Datenbank Solutions
        Solution.findOne({solution: req.body.solution}) 
        .then((solution) => {
                // Im Fall einer neuen Lösung
                if (!solution) {
                    // Erzeugen eines Eintrages in Solution
                    Solution.create({
                    solution: req.body.solution,
                    neu: 1,
                    // Nützlichkeitswert: Funktion "usefulValue" siehe unten       
                    useful: usefulValue(req.body),
                    counter: 1,
                    task: req.body.task
                    })
                    .then((lsg) => {
                        //Erzeugen eines Eintrages in SolutionAll
                        SolutionAll.create({
                            solution: lsg._id,
                            VP_Id: req.params.ip,
                            study: req.params.studyId,
                            task: lsg.task
                            });
                            // Rückmeldung über den Erfolg der Aktion
                            console.log('New Solution "' + lsg.solution + '" saved');
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(lsg);
                    }).catch((err) => next(err));
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
    }
});

// Berechnung des Nützlichkeitswertes
function usefulValue(req_body){
    //Bestimmung der zugehörigen Aufgabe
    Task.findById(req_body.task)
    .then(task => {
        if (!task) {err = new Error('Task identification failed in usefulValue')}
        // Berechnung des Nützlichkeitswertes bei Aufgabe "Neue Wörter"
        else if (task.task_type == "Neue Wörter") {
                        
            console.log(req_body.solution);
            var sol = [];
            var wort = [];
            var length = [];
            var länge = 0;
            var useful = 0;

            for(i=0;i<req_body.solution.length;i++){
                var re = new RegExp('^' + req_body.solution[i] + '$');
                var words = require('an-array-of-english-words');
                var Word = words.filter(word => word.match(re));
                wort.push(Word);
                if (Word == '') {  
                    console.log('Word "' + req_body.solution[i] + '" is not valid');
                }
                else  {
                    sol.push(req_body.solution[i]);
                    length.push(req_body.solution[i].length)
                    länge = länge + req.body.solution[i].length;
                }
            };
            //Ausgabe zum Check
            console.log(wort);   
            console.log(sol);
            console.log(length);
            console.log(länge)

            // Berechung des Nützlichkeitswertes
            // linear
            useful = länge/req_body.max;

            console.log(useful);

            // Rückgabewert
            return useful;
        }

        else if (task.task_type == "Tetris") {
            //console.log(task.task)
            console.log(task.task.split(',').forEach(function(item, index, array) {
                item.split(' ').forEach(function(item, index, array) {
                                    parseInt(item);
                                    console.log(item);
                                    console.log(typeof item)
                                });
                
                })
            )
        }
    });
}

//Berechnung des Neuheitswertes/ Aktuaisieren der Einträge
function actualizeSolution(solution, callback) {
// Aktualisieren des Wertes "counter"
solution.counter = solution.counter + 1;
// Zählen aller jemals eingegangenen Lösungen zur aktuellen Aufgabe
SolutionAll.countDocuments({task: solution.task})
.then((N_max) => {
    if(!N_max) {
        err = new Error('countDocument failed in actualizeSolution')
    }
    else {
        //Aktualisierung des Neuheitswertes dieser Lösung
        solution.neu = 1-(solution.counter/N_max);
        //console.log("Zählung: " + N_max); 
        solution.save();
        callback(solution);
        //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
        Solution.find({task: solution.task})
        .then((solutions) => {
            //console.log(solutions);
            if (!solutions) {err = new Error('countDocument failed in actualizeSolution')}
            else { 
                solutions.forEach(function(item, index, array){
                    item.neu = 1 - (item.counter/N_max);
                    console.log(item.neu);
                    item.save();
                }, solutions);  
            }
        });
    }     
    });
};

module.exports = solutionRouter;