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
    const shots: {
        id: string,
        x: number,
        y: number,
        targetX: number,
        targetY: number,
        velocityX: number,
        velocityY: number,
        hasBounced: boolean
    }[] = [];

    socket.emit('registerPlayer', { username: username, color: color });

    socket.on('currentPlayers', (currentPlayers: PlayerData[]) => {
        currentPlayers.forEach((playerData) => {
            players[playerData.id] = new Player(playerData.x, playerData.y, playerData.color);
        });
    });

    socket.on('playerShot', (shotData: { id: string, x: number, y: number, targetX: number, targetY: number }) => {
        const dx = shotData.targetX - shotData.x;
        const dy = shotData.targetY - shotData.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocityX = (dx / distance) * 5; // Adjust speed as needed
        const velocityY = (dy / distance) * 5; // Adjust speed as needed

        shots.push({
            ...shotData,
            velocityX,
            velocityY,
            hasBounced: false
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
                // Update shot position
                shot.x += shot.velocityX;
                shot.y += shot.velocityY;

                // Draw the shot
                context.fillStyle = 'red'; // Adjust color as needed
                context.beginPath();
                context.arc(shot.x, shot.y, 5, 0, Math.PI * 2); // Adjust size as needed
                context.fill();

                // Check for collision with walls
                if (shot.x <= 0 || shot.x >= canvas.width || shot.y <= 0 || shot.y >= canvas.height) {
                    if (shot.hasBounced) {
                        // Remove the shot if it has already bounced once
                        shots.splice(index, 1);
                    } else {
                        // Bounce the shot
                        if (shot.x <= 0 || shot.x >= canvas.width) {
                            shot.velocityX *= -1;
                        }
                        if (shot.y <= 0 || shot.y >= canvas.height) {
                            shot.velocityY *= -1;
                        }
                        shot.hasBounced = true;
                    }
                }
            });
        }
        requestAnimationFrame(gameLoop);
    }

    let lastShotTime = 0;
    const shotCooldownMilliseconds = 500;
    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
            const currentTime = Date.now();
            if (currentTime - lastShotTime >= shotCooldownMilliseconds) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                socket.emit('shoot', { x, y });
                lastShotTime = currentTime;
            }
        }
    });

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                socket.emit('playerMovement', { direction: 'up' });
                break;
            case 'ArrowDown':
            case 's':
                socket.emit('playerMovement', { direction: 'down' });
                break;
            case 'ArrowLeft':
            case 'a':
                socket.emit('playerMovement', { direction: 'left' });
                break;
            case 'ArrowRight':
            case 'd':
                socket.emit('playerMovement', { direction: 'right' });
                break;
        }
    });

    gameLoop();
}