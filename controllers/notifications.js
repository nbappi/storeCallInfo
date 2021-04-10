var notificationsModel = require("../models/notifications");
var roleModel = require("../models/role");
var usersModel = require("../models/users");

exports.findAll = function (req, res) 
{
    usersModel.findOne({ username : req.headers.userinfo }, function (err, user) {
        roleModel.findOne({_id: user.role_id }, function(err, role) {
              role.descendants(function(err, desRoles) {
                var rolesId = desRoles.map(function(p) {return p._id; }).sort();
                usersModel.find({ role_id : { $in: rolesId}}, function (err, users) {
                    if (err) {
                        throw err;
                    }
                    var usersId = users.map(function(p) {return p.username; }).sort();
                    notificationsModel.find({ user : { $in: usersId }}, function (err, results) {
                        if (err) {
                            throw err;
                        }

                        res.send(results);
                    }).sort([['date', 'descending']]);
                 });
            });
        });
    });

};

exports.update = function (req, res)
{
     usersModel.findOne({ username : req.headers.userinfo }, function (err, user) {
            roleModel.findOne({_id: user.role_id }, function(err, role) {
                  role.descendants(function(err, desRoles) {
                    var rolesId = desRoles.map(function(p) {return p._id; }).sort();
                    usersModel.find({ role_id : { $in: rolesId}}, function (err, users) {
                        if (err) {
                            throw err;
                        }
                        var usersId = users.map(function(p) {return p.username; }).sort();
                    

                          var conditions = { _id: req.params.id }
                                , update = { status : "seen"}
                                , options = { multi: true };

                            notificationsModel.update(conditions, update, options, callback);

                                function callback (err, numAffected) {
                                    // numAffected is the number of updated documents
                                }

                            res.send("update one");
                     });
                });
            });
        });

};