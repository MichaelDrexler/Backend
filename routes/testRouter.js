var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var mongoose = require('mongoose');
var fs = require('fs');

var Solution = require('../models/solution').Solution;
var SolutionAll = require('../models/solution').SolutionAll;
var User = require('../models/user');

var testRouter = express.Router();

testRouter.use(bodyParser.json());

//////////////////////////
// Route zu den einzelnen Studien
// Einsehen der Ergebnisse einzelner Studien
// Eingabe der Lösungen eine VP und Speichern in der Datenbank

testRouter.route('/:userId/:studyId')
.post((req, res, next) => {

        console.log(req.body.solution);
        
        var sol = req.body.solution.split(',');
        sol.sort();
        console.log(sol);
        console.log(typeof sol);
        res.send("Bast!");
        
    }
);

module.exports = testRouter;