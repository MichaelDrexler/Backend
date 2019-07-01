var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var passportLocalMongoose = require('passport-local-mongoose');
//var VPSchema = require('./study').VPSchema;

var Post_QuestionnaireSchema = new Schema({
  study:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study'
    },
    VP_id: {
      type: String,
      required: true
    },
    age: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    education_grade: {
      type: String,
      required: true
    },
    domain: {
      type: String,
      required: true
    },
    german: {
      type: String,
      required: true
    },
    dyslexia: {
      type: String,
      required: true
    },
    statement: {
          interest_arts: {
            type: String,
            required: true
          },
          imagination: {
            type: String,
            required: true
          }
    },
    games: {
          tetris: {
            type: String,
            required: true
          },
          ubongo: {
            type: String,
            required: true
          },
          scrabble: {
            type: String,
            required: true
          }
    },
    creative_achievements: {
          text1: {
            type: String, 
            required: true
          },
          text2: {
            type: String,
            required: true
          },
          text3: {
            type: String,
            required: true
          }
  },
    email: {
      type: String,
      default: "noEmail"
    },
    code: {
      type: String,
      required: true
    },
    subsequent_questionnaire: {
      type: String,
      required: true
    },
    competition: {
      type: String,
      required: true
    },
    feedback: {
      type: String,
      required: true
    }
  });
  
module.exports = Post_Questionnaire = mongoose.model("Post_Questionnaire", Post_QuestionnaireSchema, 'Post_Questionnaires');