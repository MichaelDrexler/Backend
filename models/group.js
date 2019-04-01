var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Solution = require('./solution').Solution;

var GroupSchema = new Schema ({
    group_number: {
        type: Number
    },
    group_name: {
        type: String
    },
    group_size: {
        type: Number
    }
});

var Group = mongoose.model('Group', GroupSchema, 'Groups');

module.exports = {Group, GroupSchema};