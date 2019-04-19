var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Solution = require('./solution').Solution;

var GroupSchema = new Schema ({ 
    group_name: {
        type: String
    },
    solutions: {
        type: Array
    },
    participants_count: {
        type: Number
    },
    neu_mean: {
        type: Number
    },
    useful_mean: {
        type: Number
    },
    creative_mean: {
        type: Number
    }
});

var Group = mongoose.model('Group', GroupSchema, 'Groups');

module.exports = {Group, GroupSchema};