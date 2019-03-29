var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Solution = require('./solution').Solution;

var TaskSchema = new Schema ({
    task_type: {
        type: String
    },
    config: {
        type: String
    },
    max: {
        type: String
    },
    task: {
        type: Array
    }
});

var Task = mongoose.model('Task', TaskSchema, 'Tasks');

module.exports = Task;