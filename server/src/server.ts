import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Player from './entity/player';
import { Direction, Shot } from './types';
import { calculateNewPosition } from './movement';
import { hasSubscribers } from 'diagnostics_channel';
import { SourceTextModule } from 'vm';

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
const shots: Shot[] = [];
const board = {width: 1100, height: 700};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    socket.emit(
        'currentPlayers',
        Object.entries(players).map(([id, player]) => ({
            id,
            username: player.username,
            x: player.x,
            y: player.y,
            color: player.color
        }))
    );

    socket.on('registerPlayer', (playerData: { username: string, color: string }) => {
        
        let position: {x: number, y: number};
        do {
            position = {
                x: Math.floor(Math.random() * board.width),
                y: Math.floor(Math.random() * board.height)
            };
        } while (Object.values(players).some(player => {
            const dx = position.x - player.x;
            const dy = position.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = 20; // adjust as needed
            return distance < collisionRadius;
        }));

        players[socket.id] = new Player(position.x, position.y, playerData.username, playerData.color);
        socket.emit(
            'currentPlayers',
            Object.entries(players).map(([id, player]) => ({
                id,
                username: player.username,
                x: player.x,
                y: player.y,
                color: player.color
            }))
        );
        socket.broadcast.emit('newPlayer', {
            id: socket.id,
            username: players[socket.id].username,
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
            // Basic collision detection with other players
            let canMove = true;
            for (const otherId in players) {
                if (otherId === socket.id) continue;
                const otherPlayer = players[otherId];
                const dx = newPosition.x - otherPlayer.x;
                const dy = newPosition.y - otherPlayer.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collisionRadius = 20; // adjust as needed

                if (distance < collisionRadius) {
                    canMove = false;
                    break;
                }
            }

            if (canMove) {
                player.x = newPosition.x;
                player.y = newPosition.y;
                player.movementData = newMovementData;
                io.emit('playerMoved', {
                    id: socket.id,
                    x: player.x,
                    y: player.y
                });
            }

            lastInputTimes[socket.id] = currentTime;
        }
    });

    socket.on('shoot', (shootData: { x: number, y: number }) => {
        const player = players[socket.id];
        if (player) {
            const speed = 1.15;
            const angle = Math.atan2(shootData.y, shootData.x);
            const vx = speed * Math.cos(angle);
            const vy = speed * Math.sin(angle);
        
            shots.push({
                uuid: Math.random().toString(),
                x: player.x,
                y: player.y,
                vx: vx,
                vy: vy,
                id: socket.id,
                hasBounced: false
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerDisconnected', socket.id);
    });

    const BULLET_SPEED = 1.15;
    const INTERVAL_TIME = 1000 / 60;

    setInterval(() => {
        const deltaTime = INTERVAL_TIME / 10;

        shots.forEach((shot, index) => {
            // Move bullet
            shot.x += shot.vx * deltaTime;
            shot.y += shot.vy * deltaTime;

            // Check collision with walls
            if (shot.x <= 0 || shot.x >= board.width) {
            if (shot.hasBounced) {
                shots.splice(index, 1); // Remove bullet after second wall hit
                return;
            } else {
                shot.vx = -shot.vx; // Bounce off the wall
                shot.hasBounced = true;
            }
            }

            if (shot.y <= 0 || shot.y >= board.height) {
            if (shot.hasBounced) {
                shots.splice(index, 1); // Remove bullet after second wall hit
                return;
            } else {
                shot.vy = -shot.vy; // Bounce off the wall
                shot.hasBounced = true;
            }
            }

            // Check collision with players
            for (const playerId in players) {
            if (playerId === shot.id) continue; // Ignore shooter's own bullets
            
            const player = players[playerId];
            const dx = shot.x - player.x;
            const dy = shot.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const hitRadius = 20; // Adjust hitbox size

            if (distance < hitRadius) {
                console.log(`Player ${playerId} was hit by ${shot.id}`);
                shots.splice(index, 1);
                socket.broadcast.emit('playerHit', { hitId: playerId, shooterId: shot.id });
                delete players[playerId];
                return;
            }
            }
        });
    
        // Send updated shot positions
        socket.broadcast.emit('shotsUpdated', shots.map(shot => ({ uuid: shot.uuid, x: shot.x, y: shot.y, id: shot.id })));
    }, INTERVAL_TIME);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});