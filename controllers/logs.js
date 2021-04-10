var logsModel = require("../models/logs");
var roleModel = require("../models/role");
var usersModel = require("../models/users");
var http = require('http');
var request = require('request');
var qs = require('querystring');
var fs = require('fs');
var countryModel = require("../models/country");

exports.findAll = function (req, res, next)
{
   
   logsModel
    .find({})
    .populate('user')
    .exec(function (err, results) {
      if (err){
        console.log(err);
      } 
      res.send(results);
    });
};

exports.add = function (req, res, next)
{    
    var ip = "188.166.218.109";  //  req.ip.split(":").reverse()[0]; 
    var url = 'http://ipinfo.io/'+ip;
    var inserted_item;

    logsModel.create(req.body, function (err, results) {
        if (err) {
            return res.json(err);
        }
        inserted_item = results;
        request({
            url : url,
            json : true,
            qs : {
                    log_id: JSON.stringify(results._id)
                }
            }, function(error, response, ipinfo){
            
            if(error){
                console.log("Location not found.");
                return next(error);
            }

            if(typeof ipinfo == 'undefined') {
                return next(error);
            }

            if( typeof ipinfo != 'undefined' ){
                inserted_item['request_origin'] = ipinfo;
                var conditions = { _id: inserted_item._id }
                , update = inserted_item
                , options = { multi: true };
                
                if(response.request.uri.query.split("%22")[1] == results._id.toString()){
                    logsModel.update(conditions, update, options, function (err, numAffected)
                    {
                        if(err){
                            return next(err);
                        }
                        return next();
                    });
                }

                // update country collection
                countryModel.find({}, function(err, countries){
                    var countryFlag = 0,
                        cityFlag = 0;
                    for(var i=0; i<countries.length; i++){
                        if(ipinfo.country == countries[i].name){
                            countryFlag = 1;
                            var obj = countries[i];
                            for(var j=0; j<countries[i].city.length; j++){
                                if(ipinfo.city == countries[i].city[j]){
                                    cityFlag = 1;                                    
                                }
                            }
                        }                        
                    }

                    if(!countryFlag){
                        var obj = {name: ipinfo.country, city:[ipinfo.city]};
                        countryModel.create(obj, function(err, result){
                            if(err){
                                console.log(err);
                                return next(err);
                            }
                        });
                    }
                    if(countryFlag && !cityFlag){
                        obj.city.push(ipinfo.city);
                        countryModel.update({_id:obj._id}, obj, function(err, result){
                            if(err){
                                console.log(err);
                                return next(err);
                            }
                        });
                    }
                });
                // end update country collection                
            }
        });
        //return res.json({message:"data insert",status:1,data:results});
    });
};

exports.findById = function (req, res)
{
	logsModel
    .find({ _id : req.params.id })
    .populate('user')
    .exec(function (err, results) {
      if (err){
        console.log(err);
      } 
      res.send(results);
    });
};


exports.delete = function (req, res)
{
    logsModel.remove({ _id: req.params.id }, function(err) {
        if (!err)
        {
            res.send("delete one");
        }
        else {
            console.log("can not delete");
            res.status(404).send("error: can not delete");
        }
    });
    
};

exports.deleteAll = function (req, res)
{
    var ids = req.query.delete_ids;
    logsModel.remove({ _id: {$in : ids}  }, function(err) {
        if (err)
        {
            res.status(404).send("Can not delete multiple items.");
        }
        
    });

    res.send("deleted multiple");
};

exports.update = function (req, res)
{

    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    logsModel.update(conditions, update, options, callback);

    function callback (err, numAffected)
    {
        if(!err){
            res.send("update one");
        } else{
            res.status(500).send();
        }
    }    
};


// find self and descendant users, then find logs 

exports.findSelfAndDescendantUsersLogs = function(req, res, next)
{
    roleModel.findOne({name: 'Admin'}, function(err, root) {
        roleModel.rebuildTree(root, root.lft, function() {
            roleModel.findOne({_id: req.user.role_id._id})
            .exec(function (err, creed) {
                if (err) {
                    console.log(err.message);
                    return next(err);
                }
                if(!creed){
                    return res.status(404).send("Users not found!");
                }

                creed.treeLength(function(err, treeLength){
                    creed.level(function(err,user_level){
                        var visibilityLevel = parseInt(req.query.level);
                
                        creed.selfAndDescendants(function(err, roles) {
                            if (err) {
                                return next(err);
                            }
                            if(!roles){
                                return res.status(404).send("Roles not found!");
                            }

                            var sad_role_ids = []; // all self and descendant roles                            
                            var role_ids = [], counter = 0, visibility_roles=[], self_role;
                            roles.forEach(function (role) {
                                sad_role_ids.push(role._id);
                                if(role._id.toString() == req.user.role_id._id.toString()){
                                    self_role = role;
                                }
                                role.level(function (err, value) {
                                    counter++;
                                    if((value >= user_level) && (value<=(user_level+visibilityLevel))) {
                                        role_ids.push(role._id);
                                        visibility_roles.push(role);
                                    }
                                        
                                    if (counter == roles.length){

                                        // find only users according to visibility level
                                        usersModel.find({role_id: {'$in': role_ids}})
                                        .exec(function (err, users) {
                                            if (err){
                                                return next(err);
                                              }
                                            if(!users){
                                                return res.status(404).send("Users not found!");
                                            }
                                            var user_ids = [];
                                            users.forEach(function(user){
                                                user_ids.push(user._id);
                                            });
                                            
                                            logsModel.find({user:{'$in': user_ids}})
                                            .populate('user')
                                            .exec(function (err, logs) {
                                              if (err){
                                                return next(err);
                                              }
                                              if(!logs){
                                                return res.status(404).send("Logs not found!");
                                              }
                                              res.send([
                                                    {'logs':logs}
                                                    ,{'treeLength':treeLength}
                                                    ,{'roles':roles}
                                                    ,{'users':users}
                                                    ,{'visibility_roles':visibility_roles}
                                                    ,{'self_role': self_role}
                                                ]);
                                            });   
                                        });
                                    }
                                });
                            });
                        });
                    });
                });            
            });
        });
    });
};


