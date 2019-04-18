var Task = require('../models/task');
//
// Berechnung des Nützlichkeitswertes
//
// Definition usefulValue
//Definition callback
function usefulValue(req, next, callback){   
    //Bestimmung der zugehörigen Aufgabe
    Task.findById(req.body.task)
    .then(task => {
        if (!task) {err = new Error('Task identification failed in usefulValue')}
        // Berechnung des Nützlichkeitswertes bei Aufgabe "Neue Wörter"
        else if (task.task_type == "Neue_Wörter") {
            //console.log('solution " ' + req.body.solution + ' " was given');
            var sol = [];
            //var wort = [];
            var length = [];
            var länge = 0;
            var useful = 0;
            for(i=0;i<req.body.solution.length;i++){
                // Abfrage, ob Lösungswort gleich einem vorgegebenen Wort
                if (task.task.includes(req.body.solution[i])) {
                    //console.log(req.body.solution + 'is not valid, equals given word')
                }
                else {
                    var re = new RegExp('^' + req.body.solution[i] + '$');
                    var words = require('an-array-of-english-words');
                    var Word = words.filter(word => word.match(re));
                    //wort.push(Word);
                    if (Word == '') {  
                        //console.log('Word "' + req.body.solution[i] + '" is not valid');
                    }
                    else  {
                        sol.push(req.body.solution[i]);
                        length.push(req.body.solution[i].length)
                        länge = länge + req.body.solution[i].length;
                    }
                }
            };
            // Berechung des Nützlichkeitswertes
            // linear
            parseInt(task.max, 10);
            useful = länge/task.max;

            // Runden auf zwei Stellen nach dem Komma
            useful = Math.round(useful*100);
            useful = useful/100;

            //Rückgabewert
            callback(useful);
           
            
        }

        // Im Fall von Tetris
        else if (task.task_type == "Tetris") {
            // Hilfsvariablen
            var base = []; // für hinterlegte Augafgabe
            var sol = []; // für Lösung
            // Wandeln der hinterlegten Aufgabe von String in Zahlen
            task.task.toString().split(',').forEach(function(item, index, array) {
            item.split(' ').forEach(function(item, index, array) {
                                item = parseInt(item, 10);
                                base.push(item); 
                            });
            });
            // Wandeln der Lösung von String in Zahlen
            req.body.solution.toString().split(',').forEach(function(item, index, array) {
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
            parseInt(task.max, 10);
            useful = count/task.max;
            //Rückgabewert
        
            useful = Math.round(useful*100);
            useful = useful/100;
        
            callback(useful);
        }
        else {
            err = new Error('task_type not found');
        }
        }, err => next(err))
        .catch(err => next(err));
        };

module.exports = usefulValue;


/*// Version von TetrisLösung ohne Buchstaben - damit code ab "im Fall von Tetris" ersetzen
    // Im Fall von Tetris
    else if (task.task_type == "Tetris") {
        // Hilfsvariablen
        var base = []; // für hinterlegte Augafgabe
        var sol = []; // für Lösung
        // Wandeln der hinterlegten Aufgabe von String in Zahlen
        task.task.toString().split(',').forEach(function(item, index, array) {
        item.split(' ').forEach(function(item, index, array) {
                            item = parseInt(item, 10);
                            base.push(item);  
                        });
        });
        // Wandeln der Lösung von String in Zahlen
        req.body.solution.toString().split(',').forEach(function(item, index, array) {
        item.split(' ').forEach(function(item, index, array) {
                            item = parseInt(item, 10);
                            sol.push(item);
                        });
        });

        var indexus = [];
        var count = 0
        for (i=0;i<base.length;i++){
            if(base[i] == 1){
                indexus.push(i); 
            } 
        }

        indexus.forEach(function(item, index){
            if (sol[item] > 0){
                count = count +1;
            } 
            else{
                return;
            }
        })

        console.log('count ' + count)
        // Berechnen der Summe aus hinterlegter Aufgabe und Lösung
        parseInt(task.max, 10);
        useful = count/task.max;
        console.log(task.max)

        //Rückgabewert
        useful = Math.round(useful*100);
        useful = useful/100;

        callback(useful);
    }
    else {
        err = new Error('task_type not found');
    }
    }, err => next(err))
    .catch(err => next(err));
};*/


