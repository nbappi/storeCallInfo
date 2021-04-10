var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//model

var scheduleSchema = new mongoose.Schema({
	event_id: { type: String },
	name: { type: String },
	job: { type: Object }
}); 

var schedule = mongoose.model('schedule', scheduleSchema);

module.exports = schedule;