var mongoose = require('mongoose');

//models
var codesSchema = new mongoose.Schema({
    country_name: { type : String},
    min_length : { type : String} ,
    max_length : { type : String},
    country_code : { type : String},
    operator_code : { type : String},
    operator_name : { type : String},
    status : { type : String},
    code_name : { type : String},
    code : { type : String},
    op_extension_name : { type : String},
    op_extension : { type : String},
    alias : { type : String}
});

var code = mongoose.model('code', codesSchema);

module.exports = code;
