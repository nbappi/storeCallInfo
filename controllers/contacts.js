var socketIO = require('../socketExt').socketIO;
var contactsModel = require("../models/contacts");
var commonExt = require("../common");
var elasticModule = require("../elasticSearch/custom");
var request = require("request");
var config = require("../config");

exports.findAll = function (req, res, next)
{
    contactsModel.find({}, function (err, results) {
        if (err) {
            return next(err);
        }
        res.send(results);
    });
};

exports.add = function (req, res, next)
{

    contactsModel.create(req.body, function (err, results) {
        if (err) {
            return next(err);
        }
        
        var multicast = require('../socketExt').multicast;
        multicast(req.headers.userinfo+' 1 Contact Add', req.ancestors_users_array, 'contacts:refresh');
        commonExt.notificationMessage('CREATE', 'Contact Add', 'contact', req.headers.userinfo, results._id.toString());

        // insert into logs collections
        if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){                
            request.put({url:config.log_url+req.query.log_id, form:{status:true}}, 
                function(err,httpResponse,body){
                    if(err){
                        console.log(err);
                    }
            });        
        
        } else {                
            var logData = createLogData(req, results);
            request.post({url:config.log_url, form:logData},function(err,httpResponse,body){
                if(err){
                    console.log(err);
                }
            });
        }

        var requestBody = req.body,
             address_2 = (requestBody.address_2) ? requestBody.address_2 : '',
             phone = (requestBody.phone) ? requestBody.phone : '',
             email = (requestBody.email) ? requestBody.email : '',
             country_name = (requestBody.country_name) ?  requestBody.country_name : '', 
             country_code = (requestBody.country_code) ?  requestBody.country_code : '',
            elasticData = {
                type: 'contacts',
                id : results._id.toString(),
                body: {
                    title : requestBody.name,
                    search_object:requestBody.name +" "+requestBody.address_1 +" "+ address_2 +" "+phone+" "+email+" "+country_name+" "+country_code
                }
            };

        elasticModule.addToIndex(elasticData,function(response)
        {
            // console.log(response);
        });

        //socketIO.emit('contacts:refresh',req.headers.userinfo+' 1 Contact Add');
        return res.json({message:"data insert",status:1,data:results});
    });
};

exports.findById = function (req, res)
{
    contactsModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
            //console.log("find single");
        }
        res.send(results);
    });
};

exports.update = function (req, res, next)
{
    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    var newObj = update;
    newObj._id = req.params.id;

    contactsModel.findById(req.params.id, function (err, old) {
        if (err) {
            return next(err);
        }
        if(!old){
            return res.status(404).send("Not Found.");
        }

        delete update._id;

        contactsModel.update(conditions, update, options, callback);

        function callback (err, numAffected)
        {
            if(err){
                return next(err);
            }   
            /*if (!numAffected.nModified) {
                return res.status(404).send("Not Found.");
            }*/

            var multicast = require('../socketExt').multicast;
            multicast(req.headers.userinfo+' 1 Contact Update', req.ancestors_users_array, 'contacts:refresh');
            commonExt.notificationMessage('UPDATE', 'Contact Update', 'contact',req.headers.userinfo, req.params.id);

            // insert into logs collections
            if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){                
                request.put({url:config.log_url+req.query.log_id, form:{status:true, user:req.user._id.toString()}}, 
                    function(err,httpResponse,body){
                        if(err){
                            return next(err);
                        }
                });        
            
            } else{
                var logData = createLogData(req, old, newObj);
                request.post({url:config.log_url, form:logData, query: {user_id: req.user._id}}, 
                    function(err,httpResponse,body){
                        if(err){
                            return next(err);
                        }
                });
            }

            var requestBody = req.body,
                 address_2 = (requestBody.address_2) ? requestBody.address_2 : '',
                 phone = (requestBody.phone) ?  requestBody.phone : '',
                 email = (requestBody.email) ? requestBody.email : '',
                 country_name = (requestBody.country_name) ?  requestBody.country_name : '',
                 country_code = (requestBody.country_code) ? requestBody.country_code : '',
                elasticData = {
                    type : 'contacts',
                    id: req.params.id,
                    body: {
                        doc: {
                            title : requestBody.name,
                            search_object:requestBody.name +" "+requestBody.address_1 +" "+ address_2 +" "+phone+" "+email+" "+country_name+" "+country_code
                        }
                    }
                };

            elasticModule.updateToIndex(elasticData,function(response){
                // console.log(response);
            });

        }
        //socketIO.emit('contacts:refresh',req.headers.userinfo+' 1 Contact Update');
        //commonExt.notificationMessage('UPDATE', 'Contact Update', 'contact', req.headers.userinfo);
        res.send("update one");

    });

    
};

exports.delete = function (req, res, next)
{
    contactsModel.findById(req.params.id, function (err, results) {
        if (err) {
            flag = false;
            return next(err);
        }
        if(!results){            
            flag = false;
            //return next();
            return res.status(404).send("Not Found.");
        }

        contactsModel.remove({ _id: req.params.id }, function(err) {
            if (err)
            {
                return next(err);                
            }
            var multicast = require('../socketExt').multicast;
            multicast(req.headers.userinfo+' 1 Contact Delete', req.ancestors_users_array, 'contacts:refresh');
            commonExt.notificationMessage('DELETE', 'Contact Delete', 'contact', req.headers.userinfo, req.params.id);

            // insert into logs collections
            if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){                
                request.put({url:config.log_url+req.query.log_id, form:{status:true}}, 
                    function(err,httpResponse,body){
                        if(err){
                            return next(err);
                        }
                });        
            
            } else{
                var logData = createLogData(req,results);
                request.post({url:config.log_url, form:logData}, 
                    function(err,httpResponse,body){
                        if(err){
                            return next(err);
                        }                        
                });
            }

            var elasticData = {
                type : 'contacts',
                id: req.params.id,
                body: { }
            };

            elasticModule.deleteToIndex(elasticData,function(response){
                // console.log(response);
            });
        });
        //socketIO.emit('contacts:refresh',req.headers.userinfo+' 1 Contact Delete');
        //commonExt.notificationMessage('DELETE', 'Contact Delete', 'contact', req.headers.userinfo);
        res.send("delete one");

    });

    
};

exports.deleteAll = function (req, res)
{
    var ids = req.query.delete_ids;
    contactsModel.remove({ _id: {$in : ids}  }, function(err) {
        if (err)
        {
            res.status(404).send("Can not delete multiple items.");
        }

         var multicast = require('../socketExt').multicast;
        multicast(req.headers.userinfo +' '+ ids.length + ' ' + 'Contact Delete', req.ancestors_users_array, 'contacts:refresh');
        commonExt.notificationMessage('DELETE', 'Contact Delete', 'contact', req.headers.userinfo, req.params.id);


        // delete multiple index from elastic
        for(var i=0; i<ids.length; i++){
            var elasticData = {
                type : 'contacts',
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


    //socketIO.emit('contacts:refresh',req.headers.userinfo+' '+ids.length +' Contacts Delete');
    //commonExt.notificationMessage('DELETE', 'Contact Delete', 'contact', req.headers.userinfo);
    res.send("deleted multiple");
};

// Export single .vcf file

exports.vcfExport = function( req , res)
{
    var vCard = require('vcards-js');
    vCard = vCard();

    contactsModel.find({ _id: req.params.id }, function( err , data)
    {
        if(err){
            res.status(404).send("Data not found...");
        }

        // upload file
        vCard.version = '2.0';
        vCard.firstName = (data[0].name == 'undefined') ? '' : data[0].name;
        vCard.cellPhone = data[0].country_code +''+data[0].phone;
        vCard.email = (data[0].email == 'undefined' ) ? '' : data[0].email;

        //set address information
        vCard.homeAddress.street = (data[0].address_1 == 'undefined') ? '' : data[0].address_1;
        vCard.homeAddress.city = data[0].address_2;

        // set country 
            vCard.homeAddress.postalCode = data[0].country_code;
            vCard.homeAddress.countryRegion = data[0].country_name;

        //set content-type and disposition including desired filename
        res.set('Content-Type', 'text/vcard; name="enesser.vcf"');
        res.set('Content-Disposition', 'inline; filename="enesser.vcf"');

        res.send([vCard.getFormattedString()]);
    });
};


exports.allVcfExport = function( req , res)
{

    var i, len, option, options, optionsObject = [];

    options = req.params.id ;
    option = options.split(',');

    for(i=0; i<option.length; i++)
    {
        optionsObject.push(option[i])
    }

    var vCard = require('vcards-js');
    vCard = vCard();

    contactsModel.find({ _id : { $in : optionsObject }}, function (err, data)
    {
        if (err) {
            throw err;
        }

        var dataList = [];
        for( var i=0; i< data.length; i++){
            vCard.version = '2.0';
            vCard.firstName = (data[i].name == 'undefined') ? '' : data[i].name;
            vCard.cellPhone = data[i].country_code +''+data[i].phone;
            vCard.email = (data[i].email == 'undefined' ) ? '' : data[i].email;

            //set address information
            vCard.homeAddress.street = (data[i].address_1 == 'undefined') ? '' : data[i].address_1;
            vCard.homeAddress.city = data[i].address_2;

            // set country 
            vCard.homeAddress.postalCode = data[i].country_code;
            vCard.homeAddress.countryRegion = data[i].country_name;

            dataList.push({ name : data[i].name, content : vCard.getFormattedString()});
        }

        res.send(dataList);
    });
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