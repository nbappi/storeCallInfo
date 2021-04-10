var socketIO = require('../socketExt').socketIO;
var codesModel = require("../models/codes");
var elasticModule = require("../elasticSearch/custom");
var commonExt = require("../common");

exports.findAll = function (req, res) {
    codesModel.find({}, function (err, results) {
        if (err) {
            throw err;
        }
        res.send(results);
    });
};

exports.add = function (req, res)
{
    codesModel.create(req.body, function (err, results) {
        if (err) {
            return res.json(err);
        }

        var requestBody = req.body,
            alias = (requestBody.alias) ? requestBody.alias : '';
            elasticData = {
            type : 'code',
            id : results._id.toString(),
            body : {
                title : requestBody.code_name,
                search_object:requestBody.code +" "+requestBody.code_name +" "+ requestBody.max_length +" "+ requestBody.min_length+" "+alias
            }
        };

        elasticModule.addToIndex(elasticData,function(response){
        });

        socketIO.emit('code:refresh',req.headers.userinfo +' 1 Code Add');
        return res.json({message:"data insert",status:1,data:results});
    });

    commonExt.notificationMessage('CREATE', 'Code Add', 'code', req.headers.userinfo);
};

exports.search = function (req, res)
{
    elasticModule.search(req,function(response){
        res.send(response);
   });
};

exports.findById = function (req, res)
{
    codesModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
            console.log("find single");
        }
        res.send(results);
    });
};

exports.update = function (req, res)
{

    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    codesModel.update(conditions, update, options, callback);

    function callback (err, numAffected)
    {
        if(!err){
            var requestBody = req.body,
                 alias = (requestBody.alias) ? requestBody.alias : '';
                elasticData = {
                    type : 'code',
                    id: req.params.id,
                    body: {
                        doc: {
                            title : requestBody.code_name,
                            search_object:requestBody.code +" "+requestBody.code_name +" "+ requestBody.max_length +" "+ requestBody.min_length+" "+alias
                        }
                    }
                };

             elasticModule.updateToIndex(elasticData,function(response){
                //console.log(response);
             });

            socketIO.emit('code:refresh',req.headers.userinfo +' 1 Code Update');
            commonExt.notificationMessage('UPDATE', 'Code Update', 'code', req.headers.userinfo);
            res.send("update one");
       }
    }
};

exports.delete = function (req, res)
{
    codesModel.remove({ _id: req.params.id }, function(err) {
        if (!err) {
            var elasticData = {
                    type : 'code',
                    id: req.params.id,
                    body: { }
                };

            elasticModule.deleteToIndex(elasticData,function(response){
                //console.log(response);
            });

            socketIO.emit('code:refresh', req.headers.userinfo +' 1 Code Delete');
            commonExt.notificationMessage('DELETE', 'Code Delete', 'code', req.headers.userinfo);
            res.send("delete one");
        }
    });
};

exports.uniqueCode = function (req, res)
{
    codesModel.find({'code':req.params.code}, function (err, results) {
        if (err) {
            console.log("find single");
        }
        res.send(results);
    });
};

exports.codeImport = function (req, res)
{
    var data=req.body;

    for(var i = 0; i < data.length; i++)
    {
        var arrayData=[];
        var Insertdata = {};
        var Insertdata = new codesModel();
        if (data[i].code) Insertdata.code = data[i].code;
        if (data[i].code_name) Insertdata.code_name = data[i].code_name;
        if (data[i].alias) Insertdata.alias = data[i].alias;
        if (data[i].min_length) Insertdata.min_length = data[i].min_length;
        if (data[i].max_length) Insertdata.max_length = data[i].max_length;
        if (data[i].code) Insertdata.country_code = data[i].code;
        if (data[i].code_name) Insertdata.country_name = data[i].code_name;
        Insertdata.status = "import";
        arrayData.push(Insertdata);

        if(data[i].code)
        {
           codesModel.findOneAndUpdate({
                    'code': data[i].code,
                    'code_name': data[i].code_name
                }, {
                    $setOnInsert: Insertdata
                }, {
                    upsert: true,
                    new: true
                },

            function callback (err, numAffected,raw)
            {
                console.log("updated code");
                if (err) {
                    res.send({'errorMessage': 'Internal problem,import operation failed'});
                }
                
                var id = numAffected._id.toString() ;
                var elasticData = {
                    type: 'code',
                    id: id
                };

                elasticModule.checkExistId( elasticData ,function(response)
                {
                    if(response===true)
                    {
                        var requestBody = numAffected ,
                            elasticData = {
                                type : 'code',
                                id: id ,
                                body: {
                                    doc: {
                                        title : requestBody.code_name,
                                        search_object:requestBody.code +" "+requestBody.code_name +" "+ requestBody.max_length +" "+ requestBody.min_length
                                    }
                                }
                            };

                     elasticModule.updateToIndex(elasticData , function(response){
                        //console.log(response);
                     });
                      
                    }else{

                        var requestBody = numAffected ,
                            elasticData = {
                                type : 'code',
                                id : id ,
                                body : {
                                    title : requestBody.code_name,
                                    search_object:requestBody.code +" "+requestBody.code_name +" "+ requestBody.max_length +" "+ requestBody.min_length
                                }
                            };

                        elasticModule.addToIndex( elasticData , function(response){
                        //console.log(response);
                     });
                    }

                });

                socketIO.emit('code:refresh','1 code import recently');
            });

        }
    }

};