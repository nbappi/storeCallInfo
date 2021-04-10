var eventsModel = require("../models/events");
var request = require("request");
var config = require("../config");

exports.findAll = function (req, res, next) {
    eventsModel.find({}, function (err, results) {
        if (err) {
            return next(err);
        }
        //console.log("events all")
        res.send(results);
    });
};

exports.findById = function (req, res, next)
{
    eventsModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
          return next(err);
        }
        res.send(results);
    });
};

exports.add = function (req, res, next)
{
    
    var icsStr = req.body.ics_str;
    //console.log(icsStr);
    eventsModel.create(req.body, function (err, results) {
        if (err) {
            return next(err);
        }

        // send to scheduler               

        var data = {event_id: results._id.toString()};
        data['name'] = results.name;
        data['ics_str'] = req.body.ics_str;

        request.post({url:config.schedule_url, form:data}, 
            function(err,httpResponse,body){
                if(err){
                    console.log(err);
                }
        });

        console.log('data inserted');
        return res.json({message:"data insert",status:1,data:results});
    });
};

exports.update = function (req, res, next)
{
    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    eventsModel.update(conditions, update, options, function(err, numAffected){
        if (err) {                
            return next(err);
        }
        if (!numAffected.nModified) {
            return res.status(404).send("Not Found.");
        }
        res.send("update one");
    });      
};

exports.delete = function (req, res, next)
{
    eventsModel.remove({ _id: req.params.id }, function(err) {
        if (err)
        {
            console.log("can not delete");
            return next(err);        
        }

        request.delete({url:config.schedule_url+req.params.id}, 
            function(err,httpResponse,body){
                if(err){
                    console.log(err);
                }
        });

        res.send("delete one");
        
    });
    
};