var roleModel = require("../models/role");

exports.findAll = function (req, res)
{
   /*roleModel.findOne({name: 'Admin'}, function(err, role) {
        roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: req.query.user_role_id}, function(err, creed) {
                if(!creed){
                    res.status(404).send();
                } else{
                    creed.selfAndDescendants(function(err, items) {
                    if (err) {
                        //throw err;
                        res.status(404).send();
                    }
                            
                    res.send(results);
                });
                }
                
            });
        });
    });*/

    roleModel.findOne({name: 'Admin'}, function(err, role) {
        roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: req.query.user_role_id})
            .exec(function (err, creed) {
                if (err) {
                    console.log(err.message);
                }
                else {
                    creed.selfAndDescendants(function(err, items) {
                        if (err) {
                            console.log(err.message);
                        } 
                        else {
                            
                            var ids = [];
                            items.forEach(function (item) {
                                //if(item.parentId){
                                    ids.push(item._id);    
                                //}                                
                            });
                            //console.log(ids);
                            roleModel.find({_id: {'$in': ids}})
                            .populate('parentId')
                            .exec(function (err, results) {
                                //console.log(results);
                                res.send(results);
                            });                           

                        }       
                        
                    });
                }
            });
        });
    });

};

exports.findDescentRow = function (req, res)
{
   roleModel.findOne({name: 'Admin'}, function(err, role) {
        roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: req.query.user_role_id}, function(err, creed) {
                if(!creed){
                    res.status(404).send();
                } else{
                    creed.descendants(function(err, results) {
                    if (err) {
                        //throw err;
                        res.status(404).send();
                    }      
                    res.send(results);
                });
                }
                
            });
        });
    });
};

exports.findAncestors = function (req, res)
{
   roleModel.findOne({name: 'Admin'}, function(err, role) {
        roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: req.query.user_role_id}, function(err, creed) {
                if(!creed){
                    res.status(404).send();
                } else{
                    creed.ancestors(function(err, results) {
                    if (err) {
                        //throw err;
                        res.status(404).send();
                    }      
                    res.send(results);
                });
                }
                
            });
        });
    });
};

exports.add = function (req, res)
{   
    roleModel.findOne({name: 'Admin'}, function(err, role) {
        roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: req.body.role_id}, function(err, creed) {
                var newRole = new roleModel({
                    name: req.body.name,
                    permissions: req.body.permissions,
                    parentId: creed._id
                });
                
                newRole.save(function(err, n) {
                    res.send("1 role added.");
                });
            });
        });
    });

};

exports.findById = function (req, res)
{
    roleModel
    .find({ _id: req.params.id })
    .populate('parentId')
    .exec(function (err, results) {
      if (err){
        console.log(err);
      } 
      res.send(results);
    });
};

exports.update = function (req, res)
{
    var conditions = { _id: req.params.id }
        , update = req.body
        , options = { multi: true };

    


    roleModel
    .findById(req.params.id)
    .exec(function (err, preUpdateSelf) {
      if (err){
        console.log(err);
      }
      roleModel.update(conditions, update, options, function (err, numAffected)
        {
            if(err){
                return next(err);
            }
            //console.log(preUpdateSelf.permissions);
            //console.log(req.body.permissions);

            //for(var module in preUpdateSelf)
            var compare = {};
            for(var module in preUpdateSelf.permissions){
                if(typeof req.body.permissions[module] == 'undefined'){
                    compare[module] = "Delete_Module";
                } else{
                    compare[module] = {};
                    for(var action in preUpdateSelf.permissions[module]){
                        if(typeof req.body.permissions[module][action] == 'undefined'){
                            compare[module][action] = true;
                        }
                    }
                }
            }
            //console.log(compare);

            roleModel.findOne({name: 'Admin'}, function(err, role) {
                roleModel.rebuildTree(role, role.lft, function() {
                    roleModel.findOne({_id: req.params.id}, function(err, self) {
                        if(err){
                            return next(err);
                        } 
                        if(!self) {
                            return res.status(404).send('self not found');
                        }
                        self.descendants(function(err, descendants) {
                            if (err) {
                                return next(err);
                            }
                            if(!descendants) {
                                return res.status(404).send('descendants not found');
                            }   
                            //iteration over descendants
                            for(var i=0; i<descendants.length; i++){
                                var obj = {};
                                //obj = descendants[i];
                                var objstr = JSON.stringify(descendants[i]);
                                obj = JSON.parse(objstr);
                                
                               for(var module in compare){
                                //console.log(obj);
                                    if(typeof obj.permissions[module] != 'undefined' && compare[module] == 'Delete_Module'){
                                        
                                        delete obj.permissions[module];
                                    } else if(typeof obj.permissions[module] != 'undefined'){
                                        for(var action in compare[module]){
                                            if(typeof obj.permissions[module][action] != 'undefined'){
                                                delete obj.permissions[module][action];
                                            }
                                        }
                                    }
                               }
                               //update descendant role
                               
                               var descendants_id = obj._id;
                               delete obj._id;
                               
                               //console.log(obj);



                               roleModel.update({_id: descendants_id}, obj, options, function (err, numAffected) {
                                    if(err){
                                        return next(err);
                                    }

                                    //console.log(numAffected);
                               });
                               //update descendant role
                            }
                            //iteration over descendants
                        });   
                    });
                });
            });
            res.send(numAffected);
        });
    });
       
};

exports.delete = function (req, res)
{
    roleModel.findOne({name: 'Admin'}, function(err, role) {
        roleModel.rebuildTree(role, role.lft, function() {
            roleModel.findOne({_id: req.params.id }, function(err, creed) {
                creed.remove(function() {
                    res.send("1 role deleted.");
                });
            });
        });
    });    
    
};


