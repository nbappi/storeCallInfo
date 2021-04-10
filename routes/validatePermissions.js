function validatePermissions(req, res, next){
	
	var permissions = req.user.role_id.permissions; 
	
	var method = req.method;
	var path = req.path;

	//console.log("hello", path,method, req.query);

	var slash = path.split('/');
	var module = slash[1];

	switch(module){
		case 'code': 
			module = 'Codes';
			break;
		case 'contact': 
			module = 'Contacts';
			break;
		case 'currency': 
			module = 'Currency';
			break;
		
		case 'role': 
			module = 'Role';
			break;
		
		case 'users': 
			module = 'Users';
			break;
		
		case 'logs': 
			module = 'Logs';
			break;
		case 'default': 
			break;	
	}

	//console.log(module, method);

	if(module == 'Logs' && method == 'POST'){
		//console.log(method, module);
		return next();
	}

	if(module == 'Logs' && method == 'PUT'){

		if(permissions['Logs']){
			if(permissions['Logs']['Undo'] && (permissions['Logs']['Undo'] == true)){
				console.log("undo action allowed");
				//next();
			} else{
				console.log("undo action not found.");
				return res.status(404).send("undo action not found.");
			}
		} else{
			console.log("logs module not found.");
			return res.status(404).send("logs module not found.");
		}

		return next();
	}

	// undo log
	if(typeof req.query.undo_status != 'undefined' && req.query.undo_status =='yes'){
		if(permissions['Logs']){
			if(permissions['Logs']['Undo'] && (permissions['Logs']['Undo'] == true)){
				console.log("undo action allowed");				
			} else{
				console.log("undo action not found.");
				return res.status(404).send("undo action not found.");
			}
		} else{
			console.log("logs module not found.");
			return res.status(404).send("logs module not found.");
		}

		return next();			
	}

	switch(method){
		
		case 'POST':
			method = 'Add'
			break;
		case 'PUT':
			method = 'Edit'
			break;
		
		case 'default':
			break;
	}
	//console.log("action: ", req.query.action);
	if(req.query.action == "List"){
		return next();
	}
	if ( (typeof req.query.action !='undefined') && (req.query.action != 'no') ) {
		method = req.query.action;		
	}

	req.app = module;
	req.action = method;

	//console.log("method :", method);

	if(permissions[module]){
		if(permissions[module][method] && (permissions[module][method] == true)){
			console.log("action allowed");
			next();
		} else{
			console.log("this action not found.");
			return res.status(404).send("this action not found.");
		}
	} else{
		console.log("module not found.");
		return res.status(404).send("module not found.");
	}	
}

module.exports = validatePermissions;