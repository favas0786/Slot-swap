const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); 


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});


connectDB();


app.use(express.json({ extended: false }));
app.use(cors());


let onlineUsers = {};

const addUser = (userId, socketId) => {
  onlineUsers[userId] = socketId;
};

const removeUser = (socketId) => {
  onlineUsers = Object.entries(onlineUsers)
    .filter(([userId, id]) => id !== socketId)
    .reduce((acc, [userId, id]) => ({ ...acc, [userId]: id }), {});
};

const getUserSocket = (userId) => {
  return onlineUsers[userId];
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);


  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
  });


  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    removeUser(socket.id);
  });
});

app.get('/', (req, res) => res.send('SlotSwapper API Running'));


app.use((req, res, next) => {
  req.io = io;
  req.getUserSocket = getUserSocket;
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/swap', require('./routes/swap'));


const PORT = process.env.PORT || 5000;


server.listen(PORT, () => console.log(`Server started on port ${PORT}`));