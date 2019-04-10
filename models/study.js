var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var GroupSchema = require('./group').GroupSchema;
var SolutionSchema = require('./solution').SolutionSchema;

var StudySchema = new Schema ({
    study_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    open: {
        type: Boolean,
        default: true
    },
    study_link: {
        type: Array
    },
    groups: [GroupSchema],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    solutions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SolutionAll'
    }],
    user:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},
    {
    timestamps: true
    }
);

var Study = mongoose.model('Study', StudySchema, 'Studies');

module.exports = {
    Study,
    StudySchema
};