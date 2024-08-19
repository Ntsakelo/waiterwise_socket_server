import { createServer}  from "http";
import {Server} from 'socket.io'
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors())

const httpServer = createServer(app);

const io = new Server(httpServer,{
    cors:{
        origin:'http://localhost:3000',
        methods:['GET','POST'],
  }
});

interface OnlineUser{
    userId: number,
    socketId: string,
}

let onlineUsers:OnlineUser[] = [];
let editingUsers:OnlineUser[] = [];

io.on('connection',(socket) => {
    socket.on("addOnlineUser", (userId) => {
        !onlineUsers.some(user => user.userId === userId) && userId && 
        onlineUsers.push({
            userId,
            socketId:socket.id
        })
       
        //console.log("onlineUsers",onlineUsers);

        io.emit("getOnlineUsers", onlineUsers)
    });

   //add message
   socket.on("sendMessage", (message) => {
    const user = onlineUsers.find(user => user.userId === message.recepient_id);

    if(user){
        io.to(user.socketId).emit("getMessage", message);
        io.to(user.socketId).emit("getNotification", {
            sender_id: message.sender_id,
            message: message.message_text,
            message_id: message.id,
            is_read: message.is_read
        });
    }
   }) 

   socket.on("scheduleEdit", member => {
       socket.join(member.resturant_id);
      // console.log("joined member",member);
   })

   socket.on("scheduleUpdate", result => {
      const user = onlineUsers.find(user => user.userId === result.notification_data.waiter_id)
      io.to(result.resturant_id).emit("getUpdatedSchedule",result.schedule);
     // console.log(result.schedule)
     if(user){
        io.to(user.socketId).emit('getUpdateNotification', result.notification_data);
        console.log(result.notification_data)
     }
   })

   socket.on("disconnect", () => {
     onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id)

     io.emit("getOnlineUsers", onlineUsers)
   }) 
     
})



httpServer.listen(5000,() => {
    console.log('socket running')
})
