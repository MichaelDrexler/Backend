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
    groups: [GroupSchema]
    ,
    study_link: {
        type: String,
        default: 'link'
    },
    solutions:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SolutionAll'
    }]
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