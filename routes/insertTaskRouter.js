var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var mongoose = require('mongoose');
var fs = require('fs');

var Solution = require('../models/solution').Solution;
var SolutionAll = require('../models/solution').SolutionAll;
var Task = require('../models/task');

var insertTaskRouter = express.Router();

insertTaskRouter.use(bodyParser.json());

//////////////////////////
// Automatisierte Eingabe der Tasks in mongoDb -> route: "insertTasks"

insertTaskRouter.route('/')
.post((req, res, next) => {

        Task.create(
            {task_type:"Neue_Wörter",config:"1",max:"30",task:["pen", "pencil", "penncylvania", "penthouse"]},
            {task_type:"Neue_Wörter",config:"2",max:"25",task:["threshold", "handle", "warmth", "snow"]},
            {task_type:"Neue_Wörter",config:"3",max:"24",task:["desk", "computer", "lamp", "scissors"]},
            {task_type:"Neue_Wörter",config:"4",max:"15",task:["sky", "earth", "sun", "star"]},
            {task_type:"Neue_Wörter",config:"5",max:"28",task:["thought", "illuminate", "combine", "idea"]},
            {task_type:"Neue_wörter",config:"6",max:"29",task:["calculate", "number", "number", "operator"]},
            {task_type:"Neue_Wörter",config:"7",max:"23",task:["fwkgen", "dreg", "jdhnst", "kllmiut"]},
            {task_type:"Neue_Wörter",config:"8",max:"24",task:["car", "street", "road", "supermarket"]},
            {task_type:"Neue_Wörter",config:"9",max:"23",task:["book", "letter", "word", "sentence"]},
            {task_type:"Neue_Wörter",config:"10",max:"21",task:["mountain", "stone", "rock", "face"]},
            {task_type:"Tetris",config:"1",max:"28",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 0 1 1 1 1 1 0","0 0 0 0 1 1 1 1 1 0","0 0 0 0 1 1 0 0 0 0","0 0 0 0 1 1 0 0 0 0","0 0 0 0 1 1 0 0 0 0","0 0 1 1 1 1 0 0 0 0","0 0 1 1 1 1 0 0 0 0","0 0 1 1 1 1 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"2",max:"24",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 1 1 1 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 0 0 0 0 0","0 1 1 1 1 1 1 0 0 0","0 1 1 1 1 1 1 0 0 0","0 0 0 1 1 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"3",max:"24",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 1 0 0 0 0","0 0 0 0 0 1 0 0 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 1 0 0 0","0 0 0 0 1 1 1 1 0 0","0 0 1 1 1 1 0 0 0 0","0 0 1 1 1 1 0 0 0 0","0 0 0 0 1 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"4",max:"24",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 0 1 1 1 1 0 0","0 0 1 1 1 0 1 0 0 0","0 0 1 1 1 1 1 1 1 0","0 0 1 1 0 0 0 0 0 0","0 0 1 1 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"5",max:"28",task:["0 0 0 0 0 0 0 0 0 0","0 0 1 0 0 0 0 0 0 0","0 0 1 1 0 0 0 0 0 0","0 1 1 1 1 0 0 0 0 0","0 0 1 0 1 1 1 1 1 0","0 0 1 0 0 0 1 1 0 0","0 0 1 1 1 1 1 0 0 0","0 0 1 1 1 1 0 0 0 0","0 0 1 1 1 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"6",max:"32",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 0 0 0 0","0 1 1 1 1 1 0 0 0 0","0 1 1 1 1 1 1 0 0 0","0 0 0 1 1 1 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"7",max:"32",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 1 0 0 0 0","0 0 1 0 0 1 0 0 0 0","0 0 1 0 1 1 1 1 0 0","0 1 1 1 1 1 1 1 1 0","0 1 1 1 1 1 1 1 1 0","0 0 0 1 1 1 1 1 0 0","0 0 0 0 0 1 0 1 0 0","0 0 0 0 0 1 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"8",max:"24",task:["0 0 0 0 0 0 0 0 0 0","0 1 0 0 0 0 0 0 0 0","0 1 1 1 1 1 1 1 1 0","0 1 1 0 0 1 1 1 0 0","0 1 1 0 1 1 1 1 0 0","0 0 1 0 1 1 0 0 0 0","0 0 1 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"9",max:"32",task:["0 0 0 0 0 0 0 0 0 0","0 1 1 1 1 1 0 0 0 0","0 1 1 1 1 0 0 0 0 0","0 1 1 1 1 0 0 1 1 0","0 1 0 1 1 0 0 0 1 0","0 1 0 0 0 0 0 0 1 0","0 1 1 0 0 0 0 0 1 0","0 1 1 1 1 1 1 1 1 0","0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"10",max:"32",task:["0 0 0 0 0 0 0 0 0 0","0 0 0 0 0 1 0 0 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 1 1 0 0","0 0 0 1 1 1 0 0 0 0","0 0 1 1 1 1 1 0 0 0","0 0 1 1 1 1 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"11",max:"44",task:["0 0 0 0 0 0 0 0 0 0","0 1 1 1 0 1 1 1 0 0","0 1 1 1 1 1 1 1 0 0","0 1 1 1 1 1 0 0 0 0","0 1 1 1 1 1 0 0 0 0","0 0 1 1 1 1 0 0 0 0","0 1 1 1 1 1 0 0 1 0","0 1 0 0 1 1 1 0 1 0","0 0 0 1 1 1 1 1 1 0","0 0 0 0 0 0 0 0 0 0"]},
            {task_type:"Tetris",config:"12",max:"44",task:["0 0 0 0 0 0 0 0 0 0","0 0 1 1 0 1 1 1 0 0","0 1 1 1 1 1 1 1 1 0","0 1 1 0 0 0 1 1 0 0","0 0 1 0 0 1 1 1 1 0","0 1 1 1 0 0 0 1 1 0","0 1 1 0 0 0 1 1 1 0","0 1 1 1 1 1 1 1 1 0","0 1 0 1 1 1 0 0 0 0","0 0 0 0 0 0 0 0 0 0"]}
                    ).then((es) => console.log('Ok'))
                    
    }
);

module.exports = insertTaskRouter;