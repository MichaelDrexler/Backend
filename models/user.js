var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var StudySchema = require('./study').StudySchema;

var UserSchema = new Schema({
    _id: Schema.Types.ObjectId,
    admin:   {
        type: Boolean,
        default: false
    },
    studies: [StudySchema]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema, 'Users');