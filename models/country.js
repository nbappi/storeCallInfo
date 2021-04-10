var mongoose = require('mongoose');

var countrySchema = new mongoose.Schema({
    name: { type : String},
    city: [String]
});

var country = mongoose.model('country', countrySchema);

module.exports = country;

