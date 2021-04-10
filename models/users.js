var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

//models
var usersSchema = new mongoose.Schema({
    username: { type : String},
    password : { type : String},
    loginData : { type : Schema.Types.Mixed},
    tabData : { type : Schema.Types.Mixed},
    role_id: { type: Schema.Types.ObjectId, ref: 'role' }
});

var users = mongoose.model('user', usersSchema);

module.exports = users;
