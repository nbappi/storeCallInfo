/*module.exports.socketExtFunc = function (socket)
{
    module.exports.socketIO = socket;
};*/

module.exports.socketExtFunc = function (io) {
    module.exports.socketIO = io;
    io.on('connection', function (socket) {
        //console.log('new connection');
        //console.log(io.sockets.adapter.rooms);
        socket.on('disconnect', function () {
            //console.log('connection lost');
            socket.leave(socket.username);
            //console.log(socket.username + 'left');
        });

        socket.on('join', function (username) {
            //console.log(username);
            socket.username = username;
            socket.join(socket.username);
            //console.log(io.sockets.adapter.rooms);
        });

        // public API
        module.exports.getSocket = function () {
            return socket;
        }

        module.exports.join = function (username) {
            if (!socket.username) {
                socket.username = username;
                socket.join(socket.username);
            }
            //console.log(io.sockets.adapter.rooms);  
        }
        module.exports.broadcast = function (event, msg) {
            //console.log(msg);
            socket.emit(event, msg);
        }
        module.exports.multicast = function (msg, receipients, event) {
            for (var receipient in receipients) {
                //console.log(receipients[receipient]);
                //socket.broadcast.to(receipients[receipient].toString()).emit(event, msg);    
                io.to(receipients[receipient].toString()).emit(event, msg);    
            } 
        }
    });
}
