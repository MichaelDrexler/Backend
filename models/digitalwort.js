var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DigitalwortSchema = new Schema ({
    solution: {
        type: String,
        required: true
    },
    neu: {
        type: Number,
        default: 0
    },
    useful: {
        type: Number,
        default: 0
    },
    counter: {
        type: Number,
        default: 0
    }
});

var Digitalwort = mongoose.model('Digitalwort', DigitalwortSchema, 'Digitalwort');

module.exports = {
    Digitalwort,
    DigitalwortSchema
}