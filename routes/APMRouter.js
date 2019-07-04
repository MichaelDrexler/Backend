var express = require('express');
var bodyParser = require('body-parser');

var APM = require('../models/APM'); 

var APMRouter = express.Router();

APMRouter.use(bodyParser.json());


APMRouter.route('/')
.get((req, res, next) => {

})
.post((req, res, next) => {
    APM.create({
        VP_id: req.sessionID,
        APM_7: req.body.APM_7,
        APM_8: req.body.APM_8,
        APM_9: req.body.APM_9,
        APM_10: req.body.APM_10,
        APM_11: req.body.APM_11,
        APM_12: req.body.APM_12
    })
    .then(object => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(object);
    }, err => next(err))
    .catch(err => next(err));
})

module.exports = APMRouter;