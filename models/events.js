var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//model

var eventsSchema = new mongoose.Schema({
	name: { type: String },
	ics_str: { type: String },
	start_date: { type: String },
	end_date: { type: String }

}); 

var events = mongoose.model('event', eventsSchema);

module.exports = events;