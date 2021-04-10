var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

//models
var logSchema = new mongoose.Schema({
	user: { type: Schema.Types.ObjectId, ref: 'user' },
    action: { type : String},
    item: { type : String},
	app : { type : String},
    previous_data : { type : Schema.Types.Mixed },
    current_data : { type : Schema.Types.Mixed },    
    timestamp: { type: Date, default: Date.now },
    request_origin: { type : Schema.Types.Mixed },
    user_agent: { type : Schema.Types.Mixed },
    status:{type: Boolean, default: false},
    count:{type: String, default: 0 }
});

var logs = mongoose.model('log', logSchema);

module.exports = logs;
