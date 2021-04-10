var loadUser = require("./loadUser");
var validatePermissions = require("./validatePermissions");
var validatePermissionsForRole = require("./validatePermissionsForRole");

exports.routes = function (app) {
    //global routing
    app.get("/", function (req, res) {
        res.send("hello world");
    });

    // Login routing
    var loginController = require("../controllers/login");
    app.post('/user/login', loginController.findUser );
    app.put('/user/:id', loginController.updateUser );
    app.get('/user/:id', loginController.findById );

    // Notifications Routing
    var notificationController = require("../controllers/notifications");
    app.get("/notification", notificationController.findAll);
    app.put("/notification/:id", notificationController.update);

    //Codes routing
    var codesController = require("../controllers/codes");  
    app.get('/code/check/:code', codesController.uniqueCode);
    app.post ('/code/import', codesController.codeImport);

    //Schedule routing
    var scheduleController = require('../controllers/schedule');
    app.get("/schedule/:id", scheduleController.findById);
    app.post("/schedule", scheduleController.add);
    //app.put("/schedule/:id", scheduleController.update);
    app.delete("/schedule/:id", scheduleController.delete);

    //Events routing
    var eventsController = require("../controllers/events");
    app.get("/events", eventsController.findAll);
    app.get("/events/:id", eventsController.findById);
    app.post("/events", eventsController.add);
    app.put("/events/:id", eventsController.update);
    app.delete("/events/:id", eventsController.delete);
    
    // MIDDLEWARE Load User
    app.use(loadUser);
    app.post("/code/search", codesController.search);

    // MIDDLEWARE Validater Permissions
    app.use(validatePermissions);

    //Logs routing
    var logsController = require("../controllers/logs");
    app.get("/logs", logsController.findSelfAndDescendantUsersLogs);
    app.get("/logs/:id", logsController.findById);
    app.post("/logs", logsController.add);
    app.put("/logs/:id", logsController.update);
    app.delete("/logs/:id", logsController.delete);
    app.delete("/logs", logsController.deleteAll);

    // codes
    app.get("/code", codesController.findAll);
    app.get("/code/:id", codesController.findById);
    app.post("/code", codesController.add);
    app.put("/code/:id", codesController.update);
    app.delete("/code/:id", codesController.delete);

    //Currency routing
    var currenciesController = require("../controllers/currencies");
    app.get("/currency", currenciesController.findAll);
    app.get("/currency/:id", currenciesController.findById);
    app.post("/currency", currenciesController.add);
    app.put("/currency/:id", currenciesController.update);
    app.delete("/currency/:id", currenciesController.delete);
    app.delete("/currency", currenciesController.deleteAll);

    //Contacts routing
    var contactsController = require("../controllers/contacts");
    app.get("/contact", contactsController.findAll);
    app.get("/contact/:id", contactsController.findById);
    app.post("/contact", contactsController.add);
    app.put("/contact/:id", contactsController.update);
    app.delete("/contact/:id", contactsController.delete);
    app.delete("/contact", contactsController.deleteAll); 

    // contact vcf export files
    app.get("/contact/vcfExport/:id", contactsController.vcfExport);
    app.get("/contact/allVcfExport/:id", contactsController.allVcfExport); 

    // Users routing
    var usersController = require("../controllers/users");
    app.get("/users", usersController.findAll);
    app.get("/users/:id", usersController.findById);
    app.get("/users/role/:id", usersController.findByRoleId);
    app.post("/users", usersController.add);
    app.put("/users/:id", usersController.update);
    app.delete("/users/:id", usersController.delete);    

    //Role routing
    var roleController = require("../controllers/role");
    app.get("/role", roleController.findAll);
    app.get("/role/descent", roleController.findDescentRow);
    app.get("/role/ancestors", roleController.findAncestors);
    app.get("/role/:id", roleController.findById);
    app.post("/role", validatePermissionsForRole,roleController.add);
    app.put("/role/:id", validatePermissionsForRole, roleController.update);
    app.delete("/role/:id", roleController.delete);

    // Countries routing  
    var countriesController = require("../controllers/countries")  
    app.get("/countries", countriesController.findAll);
    app.get("/countries/:id", countriesController.findById);

    //error handler
    app.get("*", function (req, res) {
        res.status(404).send("invalid URL");
    });
};
