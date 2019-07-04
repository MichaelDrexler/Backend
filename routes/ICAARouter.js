var express = require('express');
var bodyParser = require('body-parser');

var ICAA = require('../models/ICAA'); 

var ICAARouter = express.Router();

ICAARouter.use(bodyParser.json());


ICAARouter.route('/')
.get((req, res, next) => {

})
.post((req, res, next) => {
    ICAA.create({
        VP_id: req.sessionID,
        literature: {
            short: req.body.literature.short,
            long: req.body.literature.long,
            newspaper: req.body.literature.newspaper,
            speech: req.body.literature.speech,
            joke: req.body.literature.joke,
            blog: req.body.literature.blog
        },
        music: {
            own_piece: req.body.music.own_piece,
            interpreted_piece: req.body.music.interpreted_piece,
            own_melodie: req.body.music.own_melodie,
            own_rhythm: req.body.music.own_rhythm,
            synthesizer: req.body.music.synthesizer,
            playlist: req.body.music.playlist,
        },
        crafts: {
            created_object: req.body.crafts.created_object,
            enhanced_object: req.body.crafts.enhanced_object,
            gift: req.body.crafts.gift,
            decoration: req.body.crafts.decoration,
            planed_garden: req.body.crafts.planed_garden,
            created_cloths: req.body.crafts.created_cloths,
        },
        cooking: {
            own_dish: req.body.cooking.own_dish,
            presentation:  req.body.cooking.presentation,
            cake_decoration:  req.body.cooking.cake_decoration,
            food_sculpture:  req.body.cooking.food_sculpture,
            recipe:  req.body.cooking.recipe,
            drink: req.body.cooking.drink
        },
        sports: {
            special_skills: req.body.sports.special_skills,
            wintersports: req.body.sports.wintersports,
            summersports: req.body.sports.summersports,
            martial_arts: req.body.sports.martial_arts,
            others: req.body.sports.others,
            planed_training: req.body.sports.planed_training,
        },
        fine_arts: {
            collage: req.body.fine_arts.collage,
            logo: req.body.fine_arts.logo,
            building: req.body.fine_arts.building,
            painting: req.body.fine_arts.painting,
            sculpture: req.body.fine_arts.sculpture,
            skatch_interior: req.body.fine_arts.skatch_interior,
        },
        performing_arts: {
            theater_role: req.body.performing_arts.theater_role,
            puppet_theatre: req.body.performing_arts.puppet_theatre,
            new_dance: req.body.performing_arts.new_dance,
            interpreted_dance: req.body.performing_arts.interpreted_dance,
            video: req.body.performing_arts.video,
            animation: req.body.performing_arts.animation,
        },
        science: {
            written_thesis: req.body.science.written_thesis,
            own_theory: req.body.science.own_theory,
            technically_solved_problem: req.body.science.technically_solved_problem,
            own_construction: req.body.science.own_construction,
            programming: req.body.science.programming,
            website: req.body.science.website,
        }
    })
    .then(object => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(object);
    }, err => next(err))
    .catch(err => next(err));
})

module.exports = ICAARouter;