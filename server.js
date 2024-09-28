const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve JavaScript files from the /js directory
app.use('/js', express.static(path.join(__dirname, 'js')));

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('createRoom', (roomId) => {
        rooms[roomId] = { players: [socket.id], board: Array(9).fill(null) };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit('startGame', rooms[roomId].players);
        } else {
            socket.emit('roomFull');
        }
    });

    socket.on('makeMove', (data) => {
        const { roomId, index, player } = data;
        if (rooms[roomId]) {
            rooms[roomId].board[index] = player;
            io.to(roomId).emit('moveMade', data);
        }
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            room.players = room.players.filter(id => id !== socket.id);
            if (room.players.length === 0) {
                delete rooms[roomId];
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
