import Player from './player';
import { PlayerData } from './types';
import { Socket } from 'socket.io-client';

export function createGame(socket: Socket) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    document.body.appendChild(canvas);
    canvas.width = 800;
    canvas.height = 600;

    const players: { [id: string]: Player } = {};

    socket.on('currentPlayers', (currentPlayers: PlayerData[]) => {
        currentPlayers.forEach((playerData) => {
            players[playerData.id] = new Player(playerData.x, playerData.y, playerData.color);
        });
    });

    socket.on('playerDisconnected', (id: string) => {
        console.log('Client received: Player disconnected:', id);

        if (!context) {
            throw new Error('Cannot remove player because canvas context does not exist');
        }
        players[id].destroy(context);
        delete players[id];
    });

    socket.on('newPlayer', (playerData: PlayerData) => {
        players[playerData.id] = new Player(
            playerData.x,
            playerData.y,
            playerData.color
        );
    });

    socket.on('playerMoved', (playerData: PlayerData) => {
        if (players[playerData.id]) {
            players[playerData.id].x = playerData.x;
            players[playerData.id].y = playerData.y;
        }
    });

    function gameLoop() {
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            Object.values(players).forEach((player) => {
                player.draw(context);
            });
        }
        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                socket.emit('playerMovement', { direction: 'up' });
                break;
            case 'ArrowDown':
                socket.emit('playerMovement', { direction: 'down' });
                break;
            case 'ArrowLeft':
                socket.emit('playerMovement', { direction: 'left' });
                break;
            case 'ArrowRight':
                socket.emit('playerMovement', { direction: 'right' });
                break;
        }
    });

    gameLoop();
}