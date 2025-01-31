import Player from './player';
import { Direction, PlayerData, Shot } from './types';
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
    let shots: Shot[] = [];
    let walls: { x: number, y: number, width: number, height: number }[] = [];

    document.getElementById('revive')?.addEventListener('click', () => {
        const reviveButton = document.getElementById('revive');
        if (reviveButton) {
            reviveButton.style.display = 'none';
        }
        socket.emit('registerPlayer', { username: username, color: color });
    });

    socket.emit('registerPlayer', { username: username, color: color });

    socket.on('currentPlayers', (currentPlayers: PlayerData[]) => {
        currentPlayers.forEach((playerData) => {
            players[playerData.id] = new Player(playerData.username, playerData.x, playerData.y, playerData.color);
        });
        refreshPlayerList(players);
    });

    function refreshPlayerList(players: { [id: string]: Player }) {
        const playerList = document.getElementById('player-list');
        if (playerList) {
            playerList.innerHTML = '';
            Object.values(players).forEach((player) => {
                console.log(player);

                const playerEntry = document.createElement('div');
                playerEntry.className = 'flex items-center mb-2 mr-8';

                const colorSquare = document.createElement('div');
                colorSquare.className = 'w-4 h-4 mr-1';
                colorSquare.style.backgroundColor = player.color;

                const playerName = document.createElement('span');
                playerName.textContent = player.username;

                playerEntry.appendChild(colorSquare);
                playerEntry.appendChild(playerName);
                playerList.appendChild(playerEntry);
            });
        }
    }

    socket.on('newPlayer', (playerData: PlayerData) => {
        console.log('Client received: New player:', playerData);

        players[playerData.id] = new Player(playerData.username, playerData.x, playerData.y, playerData.color);
        refreshPlayerList(players);
    });

    socket.on('playerDisconnected', (id: string) => {
        console.log('Client received: Player disconnected:', id);

        if (!context) {
            throw new Error('Cannot remove player because canvas context does not exist');
        }
        players[id].destroy(context);
        delete players[id];
        refreshPlayerList(players);
    });

    socket.on('walls', (serverWalls: { x: number, y: number, width: number, height: number }[]) => {
        walls = serverWalls;
    });

    socket.on('playerMoved', (playerData: PlayerData) => {
        if (players[playerData.id]) {
            players[playerData.id].x = playerData.x;
            players[playerData.id].y = playerData.y;
        }
    });

    socket.on('playerHit', (hitData: { hitId: string, shooterId: string }) => {
        if (players[hitData.hitId] && context) {
            players[hitData.hitId].destroy(context);
            delete players[hitData.hitId];
            refreshPlayerList(players);

            if (hitData.hitId === socket.id) {
                const playerRejoin = document.getElementById('revive');
                if (playerRejoin) {
                    playerRejoin.style.display = 'block';
                }
            }
        }
    });

    socket.on('shotsUpdated', (updatedShots: { uuid: string, id: string, x: number, y: number }[]) => {
        shots = updatedShots.map((shot) => ({ x: shot.x, y: shot.y, color: players[shot.id]?.color || 'red' }));
    });

    function gameLoop() {
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            Object.values(players).forEach((player) => {
                player.draw(context);
            });

            shots.forEach((shot) => {
                context.fillStyle = shot.color;
                context.beginPath();
                context.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
                context.fill();
            });

            walls.forEach((wall) => {
                context.fillStyle = '#000000';
                context.fillRect(wall.x, wall.y, wall.width, wall.height);
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
                const clickX = event.clientX - rect.left;
                const clickY = event.clientY - rect.top;
                const playerId = socket.id;
                if (!playerId) return;
                const player = players[playerId];

                if (!player) return;

                const dx = clickX - player.x;
                const dy = clickY - player.y;
                const length = Math.sqrt(dx * dx + dy * dy);

                socket.emit('shoot', {
                    x: (dx / length),
                    y: (dy / length)
                });

                lastShotTime = currentTime;
            }
        }
    });


    let currentDirection: Direction | null = null;
    let lastInputTime = 0;
    const inputCooldownMilliseconds = 100;
    let movementInterval: NodeJS.Timeout | null = null;

    const startMovement = (direction: Direction) => {
        if (movementInterval) {
            clearInterval(movementInterval);
        }
        movementInterval = setInterval(() => {
            const currentTime = Date.now();
            if (currentTime - lastInputTime >= inputCooldownMilliseconds) {
                socket.emit('playerMovement', { direction });
                lastInputTime = currentTime;
            }
        }, inputCooldownMilliseconds);
    };

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                if (currentDirection !== 'up') {
                    currentDirection = 'up';
                    startMovement('up');
                }
                break;
            case 'ArrowDown':
            case 's':
                if (currentDirection !== 'down') {
                    currentDirection = 'down';
                    startMovement('down');
                }
                break;
            case 'ArrowLeft':
            case 'a':
                if (currentDirection !== 'left') {
                    currentDirection = 'left';
                    startMovement('left');
                }
                break;
            case 'ArrowRight':
            case 'd':
                if (currentDirection !== 'right') {
                    currentDirection = 'right';
                    startMovement('right');
                }
                break;
        }
    });

    window.addEventListener('keyup', (event) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'ArrowDown':
            case 's':
            case 'ArrowLeft':
            case 'a':
            case 'ArrowRight':
            case 'd':
                currentDirection = null;
                if (movementInterval) {
                    clearInterval(movementInterval);
                    movementInterval = null;
                }
                break;
        }
    });

    gameLoop();
}