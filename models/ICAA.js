var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var passportLocalMongoose = require('passport-local-mongoose');
//var VPSchema = require('./study').VPSchema;

var ICAASchema = new Schema({
    VP_id: {
        type: String,
        required: true
      },
    literature: {
        short: {
            type: String,
            required: true
        },
        long: {
            type: String,
            required: true
        },
        newspaper: {
            type: String,
            required: true
        },
        speech: {
            type: String,
            required: true
        },
        joke: {
            type: String,
            required: true
        },
        blog: {
            type: String,
            required: true
        }
    },
    music: {
        own_piece: {
            type: String,
            required: true
        },
        interpreted_piece: {
            type: String,
            required: true
        },
        own_melodie: {
            type: String,
            required: true
        },
        own_rhythm: {
            type: String,
            required: true
        },
        synthesizer: {
            type: String,
            required: true
        },
        playlist: {
            type: String,
            required: true
        }
    },
    crafts: {
        created_object: {
            type: String,
            required: true
        },
        enhanced_object: {
            type: String,
            required: true
        },
        gift: {
            type: String,
            required: true
        },
        decoration: {
            type: String,
            required: true
        },
        planed_garden: {
            type: String,
            required: true
        },
        created_cloths: {
            type: String,
            required: true
        }
    },
    cooking: {
        own_dish:{
            type: String,
            required: true
        },
        presentation: {
            type: String,
            required: true
        },
        cake_decoration: {
            type: String,
            required: true
        },
        food_sculpture: {
            type: String,
            required: true
        },
        recipe: {
            type: String,
            required: true
        },
        drink: {
            type: String,
            required: true
        }
    },
    sports: {
        special_skills: {
            type: String,
            required: true
        },
        wintersports: {
            type: String,
            required: true
        },
        summersports: {
            type: String,
            required: true
        },
        martial_arts: {
            type: String,
            required: true
        },
        others: {
            type: String,
            required: true
        },
        planed_training: {
            type: String,
            required: true
        }
    },
    fine_arts: {
        collage: {
            type: String,
            required: true
        },
        logo: {
            type: String,
            required: true
        },
        building: {
            type: String,
            required: true
        },
        painting: {
            type: String,
            required: true
        },
        sculpture: {
            type: String,
            required: true
        },
        skatch_interior: {
            type: String,
            required: true
        }
    },
    performing_arts: {
        theater_role: {
            type: String,
            required: true
        },
        puppet_theatre: {
            type: String,
            required: true
        },
        new_dance: {
            type: String,
            required: true
        },
        interpreted_dance: {
            type: String,
            required: true
        },
        video: {
            type: String,
            required: true
        },
        animation: {
            type: String,
            required: true
        }
    },
    science: {
        written_thesis: {
            type: String,
            required: true
        },
        own_theory: {
            type: String,
            required: true
        },
        technically_solved_problem: {
            type: String,
            required: true
        },
        own_construction: {
            type: String,
            required: true
        },
        programming: {
            type: String,
            required: true
        },
        website: {
            type: String,
            required: true
        }
    }
});
  
module.exports = ICAA = mongoose.model("ICAA", ICAASchema, 'ICAAs');