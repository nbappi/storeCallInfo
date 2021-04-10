var mongoose = require('mongoose');

//models
var contactsSchema = new mongoose.Schema({
    name: { type : String},
    address_1 : { type : String} ,
    address_2 : { type : String},
    phone : { type : String},
    email : { type : String},
    country_code : { type : String},
    country_name : { type : String}
});

var contact = mongoose.model('contact', contactsSchema);

module.exports = contact;
