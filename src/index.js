const path = require("path");
const http = require("http");
const express = require("express");
const socketIo = require("socket.io");
const Filter = require("bad-words");
const {getUser, addUser, removeUser, getUsersInRoom} = require("./utils/users");

const {generateMessage, generateLocationMessage} = require("./utils/messages");

const app = express(); // express app
const httpServer = http.createServer(app); // express creates its own server behind the scene
const io = socketIo(httpServer); // To configure socket io with the given server to work,
// express expects raw http server. express creates its own and we dont have access of it so we created our own http server.
const port = process.env.PORT || 3000;
// let count = 0;
io.on("connection", (socket) => { // socket is an object that contains information about new connection.
    // socket.emit('countUpdated', count); // event name created
    // socket.on('increament', () => {
    //     count++;
    //     // there is 1 issue with that, // I want to emit connection for every browser
    //     // if we open in 2 different browsers and made changes in 1 browser then the change message notification will not show in another browser but value is updated.
    //     // socket.emit("countUpdated", count);  // Emit particular connection
    //     io.emit("countUpdated", count);  // Emit every connection means emit message notification on every clent / browsers.
    // });
   

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})
        if(error) {
           return callback(error);
        }
        socket.join(user.room);
        socket.emit("message", generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit("message", generateMessage('Admin',`${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();

    }) 
    // socket.emit -> Emit to specific client
    // io.emit -> Emit to every connected clients
    // socket.broadcast.emit -> Every connect client except that socket that is emiting
    // io.to.emit -> Emit everyone in that room
    // socket.broadcast.to.emit -> Everyone except specific client but its limited to specific chat room.


    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);    
        const filter = new Filter();
        if(filter.isProfane(message)) {
           return callback('Profanity is not allowed !!');
        } 
        io.to(user.room).emit("message", generateMessage(user.username, message));
        callback();
    });

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id);    
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback("Location shared!");
    })

    socket.on("disconnect", ()=>{
        const user = removeUser(socket.id);
        if(user) {
         io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
         io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
         });
        }
    });
   
});
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));
httpServer.listen(port, () => {
    console.log("Server started !!");
});
