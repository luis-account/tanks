import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Player from './entity/player';
import { Direction, Shot } from './types';
import { calculateNewPosition } from './movement';

const app = express();
app.use(cors({ origin: '*' }));
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const walls = [
    { x: 100, y: 100, width: 200, height: 20 },
    { x: 300, y: 200, width: 20, height: 200 },
    { x: 500, y: 300, width: 160, height: 20 },
    { x: 700, y: 400, width: 200, height: 20 },
    { x: 900, y: 260, width: 20, height: 140 },
    { x: 200, y: 500, width: 260, height: 20 },
    { x: 600, y: 100, width: 20, height: 260 },
    { x: 800, y: 600, width: 180, height: 20 },
    { x: 1000, y: 100, width: 20, height: 200 },
    { x: 400, y: 600, width: 20, height: 100 },
    { x: 240, y: 240, width: 20, height: 100 },
    { x: 560, y: 440, width: 200, height: 20 },
    { x: 100, y: 360, width: 160, height: 20 },
    { x: 740, y: 200, width: 200, height: 20 }
];

const players: { [id: string]: Player } = {};
const inputCooldownMilliseconds = 100;
const lastInputTimes: { [id: string]: number } = {};
const shots: Shot[] = [];
const board = { width: 1100, height: 700 };

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

    socket.emit('walls', walls);

    socket.on('registerPlayer', (playerData: { username: string, color: string }) => {

        let position: { x: number, y: number };
        do {
            position = {
                x: Math.floor(Math.random() * board.width),
                y: Math.floor(Math.random() * board.height)
            };
        } while (
            Object.values(players).some(player => {
                const dx = position.x - player.x;
                const dy = position.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collisionRadius = 20; // adjust as needed
                return distance < collisionRadius;
            }) ||
            walls.some(wall => {
                const playerRadius = 20; // adjust as needed
                const hitX = position.x + playerRadius > wall.x && position.x < wall.x + wall.width;
                const hitY = position.y + playerRadius > wall.y && position.y < wall.y + wall.height;
                return hitX && hitY;
            })
        );

        if (playerData.color == '#000000' || playerData.color == '#ffffff') {
            playerData.color = '#FFC0CB'
        }

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
            // Basic collision detection with other players and walls
            let canMove = true;

            // Check collision with other players
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

            // Check collision with walls
            if (canMove) {
                for (const wall of walls) {
                    const playerRadius = 20; // adjust as needed
                    const nextX = newPosition.x;
                    const nextY = newPosition.y;

                    const hitX = nextX + playerRadius > wall.x && nextX < wall.x + wall.width;
                    const hitY = nextY + playerRadius > wall.y && nextY < wall.y + wall.height;

                    if (hitX && hitY) {
                        canMove = false;
                        break;
                    }
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
                x: player.x + 10,
                y: player.y + 10,
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
        const deltaTime = INTERVAL_TIME / 12;

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

            const bulletRadius = 5;
            walls.forEach((wall) => {
                const nextX = shot.x + shot.vx;
                const nextY = shot.y + shot.vy;

                const hitX = nextX + bulletRadius > wall.x && nextX - bulletRadius < wall.x + wall.width;
                const hitY = nextY + bulletRadius > wall.y && nextY - bulletRadius < wall.y + wall.height;

                if (hitX && hitY) {
                    if (shot.hasBounced) {
                        shots.splice(index, 1);
                        return;
                    }

                    // Determine bounce direction
                    const left = shot.x <= wall.x;
                    const right = shot.x >= wall.x + wall.width;
                    const top = shot.y <= wall.y;
                    const bottom = shot.y >= wall.y + wall.height;

                    if (left || right) {
                        shot.vx = -shot.vx; // Reverse X velocity
                    }
                    if (top || bottom) {
                        shot.vy = -shot.vy; // Reverse Y velocity
                    }

                    shot.hasBounced = true;
                }
            });

            // Check collision with players
            for (const playerId in players) {
                if (playerId === shot.id && shot.hasBounced == false) continue; // Ignore shooter's own bullets

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