var usersModel = require("../models/users");

exports.findAll = function (req, res)
{
    /*usersModel.find({}, function (err, results) {
        if (err) {
            throw err;
        }
        res.send(results);
    });*/

    usersModel
    .find({})
    .populate('role_id')
    .exec(function (err, results) {
      if (err){
        console.log(err);
      } 
      res.send(results);
    });
};

exports.add = function (req, res)
{
    usersModel.create(req.body, function (err, results) {
        if (err) {
            return res.json(err);
        }
        return res.json({message:"data insert",status:1,data:results});
    });
};

exports.findById = function (req, res)
{
   /* usersModel.find({ _id : req.params.id }, function (err, results) {
        if (err) {
            //console.log("find single");
        }
        res.send(results);
    });*/

    usersModel
    .find({ _id : req.params.id })
    .populate('role_id')
    .exec(function (err, results) {
      if (err){
        console.log(err);
      } 
      res.send(results);
    });
};

exports.findByRoleId = function (req, res)
{
    usersModel
    .find({ role_id : req.params.id })
    .populate('role_id')
    .exec(function (err, results) {
        if (err) {
            console.log(err);
        }
        console.log(results);
        res.send(results);
    });
};

exports.update = function (req, res)
{
    
    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    usersModel.update(conditions, update, options, callback);

    function callback (err, numAffected)
    {
        if(!err){
            res.send("update one");
        } else{
            res.status(500).send();
        }
    }    
};

exports.delete = function (req, res)
{
    usersModel.remove({ _id: req.params.id }, function(err) {
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
