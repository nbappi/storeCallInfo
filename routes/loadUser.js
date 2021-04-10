var usersModel = require("../models/users");

function loadUser (req, res, next) {
	var user_id = req.query.user_id || req.body.user;

  //console.log(req.path,user_id);
  
	usersModel
    .findOne({ _id : user_id })
    .populate('role_id')
    .exec(function (err, user) {
      if (err){
        console.log(err);
      }
      if (!user) {
      	res.status(404).send("not found");
      }
      else {

      	req.user = user;
        //console.log('got refreshed');

        // make an array of user's permitted module name
        var permission_array = [];
        for(var prop in user.role_id.permissions) {
            permission_array.push(prop);
        }
        req.user_permission_array = permission_array;

        // find ancestor role list
        var roleModel = require("../models/role");
        roleModel.findOne({name: 'Admin'}, function(err, role) {
          roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: user.role_id._id}, function(err, creed) {
              if(!creed){
                  res.status(404).send();
              } else{
                creed.ancestors(function(err, results) {
                    if (err) {
                        res.status(404).send();
                    }
                    var ancestors_role_array = [];
                    results.forEach(function(elem){
                      ancestors_role_array.push(elem._id);
                    })

                    // find users
                    var usersModel = require("../models/users");
                    usersModel
                      .find({role_id: { '$in': ancestors_role_array } })
                      .exec(function(err, users){
                        if(err){
                          console.log(err);
                          res.status(404).send();
                        }
                        var ancestors_users_array = [];
                        users.forEach(function(elem){
                          ancestors_users_array.push(elem.username);
                        });
                        req.ancestors_users_array = ancestors_users_array;
                        next();
                      });
                    
                });
              }
                
            });
          });
        });

        //next();
      }
    });
	
}

module.exports = loadUser;