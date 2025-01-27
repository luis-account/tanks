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
            players[playerData.id] = new Player(playerData.x, playerData.y);
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

    socket.on('newPlayer', (playerData: any) => {
        players[playerData.id] = new Player(
            playerData.position.x,
            playerData.position.y
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
        const player = players[socket.id!];
        switch (event.key) {
            case 'ArrowUp':
                player.move(0, -5);
                break;
            case 'ArrowDown':
                player.move(0, 5);
                break;
            case 'ArrowLeft':
                player.move(-5, 0);
                break;
            case 'ArrowRight':
                player.move(5, 0);
                break;
        }
        socket.emit('playerMovement', { x: player.x, y: player.y });
    });

    gameLoop();
}