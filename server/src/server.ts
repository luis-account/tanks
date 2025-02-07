import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import Player from './entity/player';
import { Direction, PlayerDto } from './types';
import { Game } from './game';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const game = new Game();

io.on('connection', (socket) => {
    socket.emit('currentPlayers', mapPlayerMapToDto(game.getPlayers()));
    socket.emit('walls', game.getWalls());

    socket.on('registerPlayer', (newPlayerDto: PlayerDto) => registerNewPlayer(socket, newPlayerDto));
    socket.on('playerMovement', (newMovementDirection: { direction: Direction; }) => playerMoved(socket, newMovementDirection));
    socket.on('shoot', (shootData: { x: number; y: number; }) => shotRegistered(socket, shootData));
    socket.on('disconnect', () => disconnectPlayer(socket));
});

const INTERVAL_TIME = 1000 / 500;
setInterval(() => updateGameState(INTERVAL_TIME), INTERVAL_TIME);

function disconnectPlayer(socket: Socket): void {
    game.removePlayer(socket.id);
    socket.broadcast.emit('currentPlayers', mapPlayerMapToDto(game.getPlayers()));
}

function mapPlayerMapToDto(playerMap: { [id: string]: Player }): PlayerDto[] {
    return Object.entries(playerMap).map(([id, player]) => ({
        id,
        username: player.username,
        x: player.x,
        y: player.y,
        color: player.color
    }));
}

function registerNewPlayer(socket: Socket, newPlayerDto: PlayerDto): void {
    const players = game.addPlayer(socket.id, newPlayerDto.username, newPlayerDto.color);
    socket.broadcast.emit(
        'currentPlayers',
        Object.entries(players).map(([id, player]) => ({
            id,
            username: player.username,
            x: player.x,
            y: player.y,
            color: player.color
        }))
    );
}

function updateGameState(INTERVAL_TIME: number): void {
    const newGameState = game.updateGameState(INTERVAL_TIME);

    for (const playerId of newGameState.hitPlayerIds) {
        io.emit('playerHit', { hitId: playerId });
    }

    io.emit('shotsUpdate', newGameState.shots.map(shot => ({ uuid: shot.uuid, x: shot.x, y: shot.y, id: shot.id })))
    io.emit('currentPlayers', mapPlayerMapToDto(newGameState.players));
}

function shotRegistered(socket: Socket, shotPosition: { x: number; y: number; }): void {
    game.addShotFromPlayer(shotPosition, socket.id);
}

function playerMoved(socket: Socket, newMovementDirection: { direction: Direction; }): void {
    const result = game.movePlayer(socket.id, newMovementDirection.direction);
    if (result) {
        io.emit('playerMoved', { id: result.id, x: result.x, y: result.y });
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));