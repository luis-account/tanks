import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Player from './entity/player';
import { Direction } from './types';
import { calculateNewPosition } from './movement';
import { log } from 'console';

const app = express();
app.use(cors({ origin: '*' }));
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const players: { [id: string]: Player } = {};
const inputCooldownMilliseconds = 100;
const lastInputTimes: { [id: string]: number } = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    socket.emit(
        'currentPlayers',
        Object.entries(players).map(([id, player]) => ({
            id,
            x: player.x,
            y: player.y,
            color: player.color
        }))
    );

    socket.on('registerPlayer', (playerData: { username: string, color: string }) => {
        players[socket.id] = new Player(100, 100, playerData.username, playerData.color);
        socket.emit(
            'currentPlayers',
            Object.entries(players).map(([id, player]) => ({
                id,
                x: player.x,
                y: player.y,
                color: player.color
            }))
        );
        socket.broadcast.emit('newPlayer', {
            id: socket.id,
            x: players[socket.id].x,
            y: players[socket.id].y,
            color: players[socket.id].color
        });
    });

    socket.on('playerMovement', (newMovementDirection: { direction: Direction }) => {
        const currentTime = Date.now();
        if (currentTime - (lastInputTimes[socket.id] || 0) < inputCooldownMilliseconds) {
            return;
        }

        const player = players[socket.id];
        if (player) {
            const { newPosition, newMovementData } = calculateNewPosition(player, newMovementDirection.direction);
            player.x = newPosition.x;
            player.y = newPosition.y;
            player.movementData = newMovementData;

            io.emit('playerMoved', {
                id: socket.id,
                x: player.x,
                y: player.y
            });

            lastInputTimes[socket.id] = currentTime;
        }
    });

    socket.on('shoot', (shootData: { x: number, y: number }) => {
        log('Player shot:', socket.id, shootData);
        const player = players[socket.id];
        if (player) {
            io.emit('playerShot', {
                id: socket.id,
                x: player.x + 10,
                y: player.y + 10,
                targetX: shootData.x,
                targetY: shootData.y
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});