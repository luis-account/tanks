import Player from './player';
import { PlayerData } from './types';
import { Socket } from 'socket.io-client';

export function createGame(socket: Socket, username: string, color: string) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const content = document.getElementById('content');
    if (content) {
        content.appendChild(canvas);
    } else {
        throw new Error('Content element not found');
    }
    canvas.width = 1100;
    canvas.height = 700;

    const players: { [id: string]: Player } = {};
    const shots: { id: string, x: number, y: number, targetX: number, targetY: number }[] = [];

    socket.emit('registerPlayer', { username: username, color: color });

    socket.on('currentPlayers', (currentPlayers: PlayerData[]) => {
        currentPlayers.forEach((playerData) => {
            players[playerData.id] = new Player(playerData.x, playerData.y, playerData.color);
        });
    });

    socket.on('playerShot', (shotData: { id: string, x: number, y: number, targetX: number, targetY: number }) => {
        shots.push(shotData);
    });

    socket.on('playerDisconnected', (id: string) => {
        console.log('Client received: Player disconnected:', id);

        if (!context) {
            throw new Error('Cannot remove player because canvas context does not exist');
        }
        players[id].destroy(context);
        delete players[id];
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
            shots.forEach((shot, index) => {
                context.beginPath();
                context.arc(shot.x, shot.y, 5, 0, 2 * Math.PI);
                context.fillStyle = 'black';
                context.fill();
                // Move the shot towards the target
                const dx = shot.targetX - shot.x;
                const dy = shot.targetY - shot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const speed = 5;
                if (distance > speed) {
                    shot.x += (dx / distance) * speed;
                    shot.y += (dy / distance) * speed;
                } else {
                    shots.splice(index, 1); // Remove the shot if it reaches the target
                }
            });
        }
        requestAnimationFrame(gameLoop);
    }

    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            socket.emit('shoot', { x, y });
        }
    });

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