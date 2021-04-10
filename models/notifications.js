var mongoose = require('mongoose');

//models
var notificationsSchema = new mongoose.Schema({
    message: { type : String },
    action: { type : String },
    module: { type : String },
    user: { type : String },
    count: { type : Number },
    status : { type : String },
    date: { type: Date },
    item_id : { type : String },
    log_id : { type : String }
});

var notification = mongoose.model('notification', notificationsSchema);

module.exports = notification;
