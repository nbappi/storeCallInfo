var socketIO = require('../socketExt').socketIO;
var currencyModel = require("../models/currencies");
var commonExt = require("../common");
var elasticModule = require("../elasticSearch/custom");
var request = require("request");
var config = require("../config");

//console.log(config.log_url);

exports.findAll = function (req, res) {
    //console.log(req.ancestors_users_array);
    currencyModel.find({}, function (err, results) {
        if (err) {
            throw err;
        }
        res.send(results);
    });
};

exports.add = function (req, res)
{
    req.body.conversion_rate = parseInt(req.body.conversion_rate);
    currencyModel.create(req.body, function (err, results) {
        if (err) {
            return res.json(err);
        }
        
        //socketIO.emit('currency:refresh',req.headers.userinfo+' 1 Currency Add');
        var multicast = require('../socketExt').multicast;
        multicast(req.headers.userinfo+' 1 Currency Add', req.ancestors_users_array, 'currency:refresh');
        commonExt.notificationMessage('CREATE', 'Currency Add', 'currency', req.headers.userinfo, results._id.toString());

        // insert into logs collections
        if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){                
            console.log('currency delete undo op', req.query);
            request.put({url:config.log_url+req.query.log_id, form:{status:true}}, 
                function(err,httpResponse,body){
                    if(err){
                        console.log(err);
                    }

            });        
        
        } else {                
            var logData = createLogData(req, results);
            request.post({url:config.log_url, form:logData}, 
                function(err,httpResponse,body){
                    if(err){
                        console.log(err);
                    }
            });
        }

        var requestBody = req.body,
            elasticData = {
                type: 'currency',
                id : results._id.toString(),
                body: {
                    title : requestBody.name,
                    search_object:requestBody.name +" "+requestBody.symbol + " "+requestBody.conversion_rate
                }
            };

        elasticModule.addToIndex(elasticData,function(response){
            // console.log(response);
        });        
        
        return res.json({message:"data insert",status:1,data:results});
    });
    
};

exports.findById = function (req, res)
{
    currencyModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
            //console.log("find single");
        }
        res.send(results);
    });
};

exports.update = function (req, res, next)
{
    var flag2 = true;
    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    var newObj = update;
    newObj._id = req.params.id;
        

    currencyModel.findById(req.params.id, function (err, old) {
        if (err) {
            flag2 = false;
            return next(err);
        }
        if(!old){
            flag2 = false;
            return res.status(404).send("Not Found.");
        }
        currencyModel.update(conditions, update, options, function (err, numAffected) {
            if (err) {
                flag2 = false;
                console.log(err);
                return next(err);
            }            
            
            /*if (!numAffected.nModified) {
                flag2 = false;
                //return next();
                return res.status(404).send("Not Found.");
            }*/

            var multicast = require('../socketExt').multicast;
            multicast(req.headers.userinfo+' 1 Currency Update', req.ancestors_users_array, 'currency:refresh');
            commonExt.notificationMessage('UPDATE', 'Currency Update', 'currency',req.headers.userinfo, req.params.id);    
            // insert into logs collections
            if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){                
                request.put({url:config.log_url+req.query.log_id, form:{status:true, user:req.user._id.toString()}}, 
                    function(err,httpResponse,body){
                        if(err){
                            console.log(err);
                            flag2 = false;
                            return next(err);
                        }
                });        
            
            } else{
                var logData = createLogData(req, old, newObj);
                request.post({url:config.log_url, form:logData, query: {user_id: req.user._id}}, 
                    function(err,httpResponse,body){
                        if(err){
                            flag2 = false;
                            return next(err);
                        }
                });
            }

            var requestBody = req.body,
                elasticData = {
                    type : 'currency',
                    id: req.params.id,
                    body: {
                        doc: {
                            title : requestBody.name,
                            search_object:requestBody.name +" "+requestBody.symbol + " "+requestBody.conversion_rate
                        }
                    }
                };

            elasticModule.updateToIndex(elasticData,function(response){
                 //console.log(response);
            });

            //socketIO.emit('currency:refresh',req.headers.userinfo+' 1 Currency Update');
            //commonExt.notificationMessage('UPDATE', 'Currency Update', 'currency',req.headers.userinfo, req.params.id);
            res.send("update one");
        });
    });    
    
};

exports.delete = function (req, res, next)
{
    
    var flag = true;
    
    currencyModel.findById(req.params.id, function (err, results) {
        if (err) {
            flag = false;
            return next(err);
        }
        if(!results){            
            flag = false;
            //return next();
            return res.status(404).send("Not Found.");
        }

        currencyModel.remove({ _id: req.params.id }, function(err, removeRes) {
            if (err) {
                flag = false;
                return next(err);
            }
            if(!removeRes.result.n){
                flag = false;
                //return next();
                return res.status(404).send("Not Found.");
            }
            var multicast = require('../socketExt').multicast;
            multicast(req.headers.userinfo+' 1 Currency Delete', req.ancestors_users_array, 'currency:refresh');
            commonExt.notificationMessage('DELETE', 'Currency Delete', 'currency', req.headers.userinfo, req.params.id);
            
            // insert into logs collections
            if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){                

                request.put({url:config.log_url+req.query.log_id, form:{status:true}}, 
                    function(err,httpResponse,body){
                        if(err){
                            flag = false;
                            return next(err);
                        }
                });        
            
            } else{
                var logData = createLogData(req,results);
                request.post({url:config.log_url, form:logData}, 
                    function(err,httpResponse,body){
                        if(err){
                            flag = false;
                            return next(err);
                        }
                        
                });
            }

            // insert into elastic collections
            var elasticData = {
                type : 'currency',
                id: req.params.id,
                body: { }
            };

            elasticModule.deleteToIndex(elasticData,function(response){
               // console.log(response);
            });

            //socketIO.emit('currency:refresh',req.headers.userinfo+ ' 1 Currency Delete');
            //commonExt.notificationMessage('DELETE', 'Currency Delete', 'currency', req.headers.userinfo, req.params.id);
            res.send("delete one");
        });
    });
    
};

exports.deleteAll = function (req, res)
{
    var ids = req.query.delete_ids;
    currencyModel.remove({ _id: {$in : ids}  }, function(err) {
        if (err)
        {
            res.status(404).send("Can not delete multiple items.");
        }

        var multicast = require('../socketExt').multicast;
        multicast(req.headers.userinfo+' '+ ids.length + ' ' + 'Currency Delete', req.ancestors_users_array, 'currency:refresh');
        commonExt.notificationMessage('DELETE', 'Currency Delete', 'currency', req.headers.userinfo, req.params.id);

        // delete multiple index from elastic
        for(var i=0; i<ids.length; i++){
            var elasticData = {
                type : 'currency',
                id: ids[i],
                body: { }
            };

            elasticModule.deleteToIndex(elasticData,function(response){
               // console.log(response);
            }); 
        }
        
    });

    var logData = createLogData(req,{ "count" : ids.length});
    request.post({url:config.log_url, form:logData},
        function(err,httpResponse,body){
            if(err){
                flag = false;
                return next(err);
            }
        });


    //socketIO.emit('currency:refresh',req.headers.userinfo+' '+ids.length +' Currency Delete');
    //commonExt.notificationMessage('DELETE', 'Currency Delete', 'currency', req.headers.userinfo);
    res.send("deleted multiple");
};

function createLogData(req, results, newObj){

    var logData = {
            "user": req.user._id.toString(),
            "action": req.action,
            "app": req.app,
            "request_origin": req.headers,
            "user_agent": req.useragent
        };

        if(req.action == "Add"){
            logData.previous_data = null;
            logData.current_data = results._doc;
        }
        if(req.action == "Delete"){
            logData.previous_data = results._doc;
            logData.current_data = null;
        }
        if(req.action == "Edit"){
            logData.previous_data = results._doc;
            logData.current_data = newObj;
        }
        if(req.action == "Multi_Del"){
            logData.previous_data = null;
            logData.current_data = null;
            logData.count = results.count;
        }

    return logData;
}
