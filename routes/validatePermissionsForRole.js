var roleModel = require("../models/role");
var roleController = require("../controllers/role");

function validatePermissionsForRole(req, res, next){
  console.log("validatePermissionsForRole");

  //var role_id = req.params.id;
  //console.log(role_id);
  //console.log(req.body);

  var parent_role_id = req.body.selected._id;

  var item_permissions = req.body.permissions;
  //console.log(item_permissions)

  // check with parent's permission from database
  roleModel
    .findOne({ _id: parent_role_id})
    .exec(function (err, parent) {
      if (err){
        return next(err);
      }
      if(!parent){
        return res.status(404).send("Parent role not found.");
      }
      var parent_permissions = parent.permissions;
      //console.log(item_permissions, parent_permissions);
      for(prop in item_permissions){
        if(typeof parent_permissions[prop] == 'undefined'){
          return res.status(404).send("Parent permissions are changed (module not found).");
        } else{
          for(action in item_permissions[prop]){
            if(typeof parent_permissions[prop][action] == 'undefined'){
              return res.status(404).send("Parent permissions are changed (action not found).");
            } 
          }
        }
      }
      //console.log(req.params.id);

      // check item itself with database for Edit only
      /*if(typeof req.params.id !== 'undefined'){
        //console.log('inside.')

        roleModel
        .findOne({_id:req.params.id})
        .exec(function(err,self){
          //console.log(self);
          if(err){
            return next(err);
          }
          if(!self){
            return res.status(404).send("Self role not found.")
          }
          var self_permissions = self.permissions;
          for(var module in item_permissions){
            if(typeof self_permissions[module] == 'undefined'){
              return res.status(404).send("Self permissions are changed (module not found).");
            } else{
              for(var action in item_permissions[module]){
                if(typeof self_permissions[module][action] == 'undefined'){
                  return res.status(404).send("Self permissions are changed (action not found).");
                }
              }
            }
          }
          //next(); 
        });
      }*/
      //console.log('outside.')

      next();
    });

  //next();
}

module.exports = validatePermissionsForRole;