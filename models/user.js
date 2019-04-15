var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var StudySchema = require('./study').StudySchema;

const UserSchema = new Schema({
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    studies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Study'
    }]
  });
  
module.exports = User = mongoose.model("User", UserSchema, 'Users');