var socketIO = require('../socketExt').socketIO;
var loginModel = require("../models/users");
var request = require('request');


// fire this action when a user login
exports.findUser = function(req , res, next)
{
    var user = req.body;

    if(user.username && user.password){
        loginModel
        .findOne(user)
        .populate('role_id')
        .exec(function (err, user) {
            if (err){
                console.log(err);
                return next(err);
            }
            if(!user){
                return res.status(404).send("User not found.");
            }

            var join = require('../socketExt').join;
            join(user.username);
            //var multicast = require('../socketExt').multicast;
            //multicast('i am in', ['admin', 'user2']);

            var logData = createLogData(req, user);
            request.post({url:'http://localhost:3000/logs', form:logData}, 
                function(err,httpResponse,body){
                    if(err){
                        console.log(err);
                    }
            });

            res.send(user);
        });
    }
};

// fire this action when a user click Logout button
exports.updateUser = function (req, res, next)
{
    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    loginModel.update(conditions, update, options, function (err, numAffected) {
        // numAffected is the number of updated documents
        if(err){
            return next(err);
        }
        if(!numAffected.nModified){
            //res.send(40)
        }
        var logData = createLogData(req);
        request.post({url:'http://localhost:3000/logs', form:logData}, 
            function(err,httpResponse,body){
                if(err){
                    console.log(err);
                }
        });

    });
    
    socketIO.emit('user:refresh','1 user update menu recently');
};


exports.findById = function (req, res)
{
    loginModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
            console.log("find single");
        }

        res.send(results);
    });
};

function createLogData(req, results){
    var logData = {
        "user": (typeof results != 'undefined') ? results._id.toString() : req.params.id,
        "action": (typeof req.query.action != 'undefined' && req.query.action != 'no') ? req.query.action : "Logout",
        "request_origin": req.headers,
        "user_agent": req.useragent
    };
    return logData;
}
