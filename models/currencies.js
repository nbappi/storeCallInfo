var mongoose = require('mongoose');

//models
var currenciesSchema = new mongoose.Schema({
    name: { type : String},
    symbol : { type : String} ,
    conversion_rate : { type : Number}
});

var currency = mongoose.model('currency', currenciesSchema);

module.exports = currency;
