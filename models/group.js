var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Solution = require('./solution').Solution;

var GroupSchema = new Schema ({ 
    group_name: {
        type: String
    }
});

var Group = mongoose.model('Group', GroupSchema, 'Groups');

module.exports = {Group, GroupSchema};