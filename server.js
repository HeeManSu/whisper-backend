import app from "./app.js";
import { connectDB } from "./config/database.js";
import { v2 as cloudinary } from 'cloudinary';
import { log } from "console";
import http from 'http';
import { Server } from 'socket.io';

connectDB();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
})

const server = http.createServer(app);

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL,
    }
})

io.on("connection", (socket) => {
    console.log("connected to socket.io");

    socket.on('setup', (userData) => {

        try {
            socket.join(userData?._id);
            socket.emit("Connected");
        } catch (error) {
            throw new Error(error)
        }

    });
    socket.on("join chat", (room) => {
        socket.join(room);
        // console.log(room);
        console.log("User joined Room:" + room);
    });

    socket.on('typing', (room) => socket.in(room).emit("typing"))
    socket.on('stop typing', (room) => socket.in(room).emit("stop typing"))

    socket.on("new message", (newMessageReceived) => {
        console.log(newMessageReceived?.chat?.users)
        var chat = newMessageReceived.chat;
        if (!chat.users) {
            return console.log('chat.users not defined');
        }

        // chat?.users.forEach(user => {
        //     console.log(user)
        // })

        newMessageReceived?.chat?.users.forEach(user => {

            if (user == newMessageReceived?.sender?._id) {
                return ;
            }

            try {
                socket.in(user).emit("messsage received", newMessageReceived);
                
            } catch (error) {
                throw Error(error)
            }


        })
    })
})

server.listen(process.env.PORT, () => {
    console.log(`Server is working on port: ${process.env.PORT}`)
});
