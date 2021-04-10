var mongoose = require('mongoose'),
	NestedSetPlugin = require('mongoose-nested-set');
    //Schema = mongoose.Schema;

//models
var roleSchema = new mongoose.Schema({
    name: { type : String},
    permissions: {type : Object}
});

// Include plugin
roleSchema.plugin(NestedSetPlugin);


var role = mongoose.model('role', roleSchema);
//console.log(role);

module.exports = role;
