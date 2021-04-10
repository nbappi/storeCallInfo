
var codesModel = require("../models/country");

exports.findAll = function (req, res, next) {
    codesModel.find({}, function (err, results) {
        if (err) {
            return next(err);
        }
        res.send(results);
    });
};

exports.findById = function (req, res)
{
    codesModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
            return next(err);
        }
        res.send(results);
    });
};
