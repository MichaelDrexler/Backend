var express = require('express');
var bodyParser = require('body-parser');

var Post_Questionnaire = require('../models/Post_Questionnaire'); 

var Post_QuestionnaireRouter = express.Router();

Post_QuestionnaireRouter.use(bodyParser.json());


Post_QuestionnaireRouter.route('/:studyId')
.get((req, res, next) => {

})
.post((req, res, next) => {
    Post_Questionnaire.create({
        study: req.params.studyId,
        VP_id: req.sessionID,
        age: req.body.age,
        gender: req.body.gender,
        education_grade: req.body.education_grade,
        domain: req.body.domain,
        german: req.body.german,
        dyslexia: req.body.dyslexia,
        statement: {
            interest_arts: req.body.statement.interest_arts,
            imagination: req.body.statement.imagination
        },
        games: {
            tetris: req.body.games.tetris,
            ubongo: req.body.games.ubongo,
            scrabble: req.body.games.scrabble
        },
        creative_achievements: {
            text1: req.body.creative_achievements.text1,
            text2: req.body.creative_achievements.text2,
            text3: req.body.creative_achievements.text3,
        },
        email: req.body.email,
        code: req.body.code,
        subsequent_questionnaire: req.body.subsequent_questionnaire,
        competition: req.body.competition,
        feedback: req.body.feedback
    })
    .then(object => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(object);
    }, err => next(err))
    .catch(err => next(err));
})

module.exports = Post_QuestionnaireRouter;