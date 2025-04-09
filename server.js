const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store room data
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        currentTime: 0,
        isPlaying: false,
        users: []
      };
    }
    rooms[roomId].users.push(username);
    socket.to(roomId).emit('user-connected', username);
    socket.emit('sync-playback', rooms[roomId]);
    io.to(roomId).emit('update-users', rooms[roomId].users);
  });

  socket.on('send-message', (roomId, message, username) => {
    io.to(roomId).emit('receive-message', { 
      text: message, 
      sender: username,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    Object.keys(rooms).forEach(roomId => {
      if (socket.rooms.has(roomId)) {
        socket.to(roomId).emit('user-disconnected', socket.username);
      }
    });
  });

  socket.on('play-video', (roomId, currentTime) => {
    rooms[roomId].isPlaying = true;
    rooms[roomId].currentTime = currentTime;
    socket.to(roomId).emit('play-video', currentTime);
  });

  socket.on('pause-video', (roomId, currentTime) => {
    rooms[roomId].isPlaying = false;
    rooms[roomId].currentTime = currentTime;
    socket.to(roomId).emit('pause-video', currentTime);
  });

  socket.on('seek-video', (roomId, currentTime) => {
    rooms[roomId].currentTime = currentTime;
    socket.to(roomId).emit('seek-video', currentTime);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});
