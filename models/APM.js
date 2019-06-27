var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var passportLocalMongoose = require('passport-local-mongoose');
//var VPSchema = require('./study').VPSchema;

var APM = new Schema({
    VP_id: {
      type: String,
      required: true
    },
    APM_7: {
        type: String,
        required: true
    },
    APM_8: {
        type: String,
        required: true
    },
    APM_9: {
        type: String,
        required: true
    },
    APM_10: {
        type: String,
        required: true
    },
    APM_11: {
        type: String,
        required: true
    },
    APM_12: {
        type: String,
        required: true
    },
  });
  
module.exports = APM = mongoose.model("APM", APM, 'APMs');