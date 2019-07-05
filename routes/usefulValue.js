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
        if (!task) {
            err = new Error('Task identification failed in usefulValue');
            err.status = 404;
            return next(err);
        }
        // Berechnung des Nützlichkeitswertes bei Aufgabe "Neue Wörter"
        else if (task.task_type == "Neue_Wörter") {
            //console.log('solution " ' + req.body.solution + ' " was given');
            var sol = [];
            var invalid = [];
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
                        invalid.push(req.body.solution[i]);
                        //console.log('Word "' + req.body.solution[i] + '" is not valid');
                    }
                    else  {
                        sol.push(req.body.solution[i]);
                        length.push(req.body.solution[i].length)
                        länge = länge + req.body.solution[i].length;
                    }
                }
            };

            console.log("invalid " + invalid);
            console.log("valid " + sol)

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
            // Wandel der hinterlegten Aufgabe und der Lösung in einzelne Elemente (Array)
            var score = 0;
            var aufgabe = task.task.join().replace(/,/g, ' ').split(' ');
            var lösung = req.body.solution.join().replace(/,/g, ' ').split(' ');
            console.log(aufgabe.length)
            
            for (i=0;i<aufgabe.length;i++) {
                if (aufgabe[i] == '0' && lösung[i] != '0') {
                    score = score -1;
                    console.log('1')
                }

                else if (aufgabe[i] == '0' && lösung[i] == '0') {
                    score = score;
                    console.log('2')
                }

                else if (aufgabe[i] == '1' && lösung[i] != '1') {
                    score = score + 1;
                    console.log('3')
                }

                else if (aufgabe[i] == '1' && lösung[i] == '1') {
                    score = score;
                    console.log('4')
                }
            }
            console.log(score)

            useful = score/task.max;
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



        //     // alter Bewertungsalgorthmus für Version mit addierten Zahlen
        //     //     (siehe Masterarbeit "Entwicklung eines Messwerkzeuges für Kreativität")
        //
        //     var base = []; // für hinterlegte Augfgabe
        //     var sol = []; // für Lösung
        //     // Wandeln der hinterlegten Aufgabe von String in Zahlen
        //     task.task.toString().split(',').forEach(function(item, index, array) {
        //     item.split(' ').forEach(function(item, index, array) {
        //                         item = parseInt(item, 10);
        //                         base.push(item); 
        //                     });
        //     });
        //     // Wandeln der Lösung von String in Zahlen
        //     req.body.solution.toString().split(',').forEach(function(item, index, array) {
        //     item.split(' ').forEach(function(item, index, array) {
        //                         item = parseInt(item, 10);
        //                         sol.push(item);
        //                     });
        //     });
        //     // Berechnen der Summe aus hinterlegter Aufgabe und Lösung
        //     var ergebnis = [];
        //     for(i=0;i<base.length;i++) {
        //         ergebnis[i] = base[i] + sol[i];
        //     };
        //     // Zählen der belegten inneren Felder
        //     var count = 0;
        //     ergebnis.forEach(function(item, index, array){
        //         if (item == 3){
        //             count = count +1
        //         }
        //     });
        //     // Beziehung: belegete innere Felder/ maximal mögliche Felder
        //     parseInt(task.max, 10);
        //     useful = count/task.max;
        //     //Rückgabewert
        
        //     useful = Math.round(useful*100);
        //     useful = useful/100;
        
        //     callback(useful);
        // }
        // else {
        //     err = new Error('task_type not found');
        // }
        // }, err => next(err))
        // .catch(err => next(err));
        // };

module.exports = usefulValue;