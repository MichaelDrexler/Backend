var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var mongoose = require('mongoose');
var fs = require('fs');
var usefulValue = require('./usefulValue');

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
        Solution.findOne({$and: [{solution: req.body.solution},{task: req.body.task}]}) 
        .then((solution) => {
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
                        let createSolutionAll = function(){
                            return new Promise(function(resolve, reject){
                                SolutionAll.create({
                                solution: solution._id,
                                VP_Id: req.params.ip,
                                study: req.params.studyId,
                                task: solution.task
                                }).then(()=> {
                                  resolve()  
                                })
                            }) 
                        }
                        //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
                        //Reihenfolge beachten!! Eintragen in Solutions und SolutionsAll muss vor updateNeu beendet sein
                        createSolutionAll().then(()=>{
                            console.log('hello')
                            updateNeu(solution, req.body)
                        })
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
                .then((solution) => {
                    //console.log('Lösung vor neu updet: ' + solution);
                    actualizeSolutions(solution, req.body, (solution) => {
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



// Aktualisiert in Solutions den Neuheitswert der anderen Lösungen bei neuer Lösung 
let updateNeu = function(solution, body){
    // Zählen aller Einträge zu aktuellem Task in SolutionsAll
    SolutionAll.countDocuments({task: body.task})
    .then((N_max) => {
        console.log('N_max - neuLösung: '+ N_max);
        //console.log('id  ' +solution._id);

        // Ausgeben aller Einträgezu aktuellem Task und Aktualisieren des Neuheitswertes
        Solution.find({$and:[{'task': body.task}/*, {'_id':{$ne: solution._id}}*/]})
        .then((solutions) => {
            //console.log('solu '+ solutions);
            if(solutions != null && N_max != 1) {
                solutions.forEach(function(item){
                    item.neu = 1 - item.counter/N_max;
                    //console.log('solutions.neu '+ item.neu);
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
        console.log('N_max: '+N_max)
        console.log('id '+solution.solution)

        //Aktualisierung des Neuheitswertes dieser Lösung, Berechnung linear
        Solution.findById(solution.solution /*ref in SolutionsALl*/)
        .then(solution => {
            console.log(solution)
            solution.counter = solution.counter + 1;
            solution.neu = 1 - (solution.counter/N_max);
            solution.save()
            .then(solution => {
                callback(solution)});
        })
        //Aktualisieren des Neuheitswertes der anderen Lösungen zu diesem Task
        Solution.find({$and:[{'task': body.task}, {'_id':{$ne: solution.solution}}]})
        .then((solutions) => {
            //console.log('solutions: '+ solutions);
            if(solutions != null && N_max != 1) {
                solutions.forEach(function(item){
                    item.neu = 1 - item.counter/N_max;
                    //console.log('solutions.neu '+ item.neu);
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