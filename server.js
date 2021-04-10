var express = require("express");
var http       = require("http");
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var routes = require("./routes/routes");
var cors = require('cors');
var sockExt = require('./socketExt');
var useragent = require('express-useragent');

//application 
var app = express();

var server     = http.createServer(app);
var socketio = require('socket.io')(server);

//middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded ({
    extended: true
}));
app.use(useragent.express());

//socket IO ext
sockExt.socketExtFunc(socketio);

//routing
routes.routes(app);

//db connection
mongoose.connect("mongodb://localhost:27017/comx/");
var db = mongoose.connection;
db.on('error', function (e) {
    console.log("Error connecting MongoDB: " + e.message);
});
db.once('open', function() {
    console.log("REST server connected to MongoDB");
});

//listen
server.listen(3000, function () {
	console.log("REST server listening on port 3000");
});

/*sockExt.socketIO.on('connection', function(socket)
{
    console.log("client connected");

    socket.on('event', function(data){
        console.log(data);

    });

    socket.on('disconnect', function(){
        console.log("client disconnected");
    });
});*/