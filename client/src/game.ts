import { Board } from './board';
import Player from './player';
import { Direction, PlayerData, Shot, Wall } from './types';
import { Socket } from 'socket.io-client';
import { UserInteractionListener } from './UserInteractionListener';

export function createGame(socket: Socket, username: string, color: string) {
    const board = new Board(document.getElementById('content')!);
    const userInteractionListener = new UserInteractionListener(movementEmitter, shotEmitter, board.getCanvas());
    
    const players: { [id: string]: Player } = {};

    let shots: Shot[] = [];
    let walls: Wall[] = [];

    document.getElementById('revive')?.addEventListener('click', () => {
        const reviveButton = document.getElementById('revive')!;
        reviveButton.style.display = 'none';
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

        if (!board.getContext()) {
            throw new Error('Cannot remove player because canvas context does not exist');
        }
        players[id].destroy(board.getContext());
        delete players[id];
        refreshPlayerList(players);
    });

    socket.on('walls', (serverWalls: Wall[]) => walls = serverWalls);

    socket.on('playerMoved', (playerData: PlayerData) => {
        if (players[playerData.id]) {
            players[playerData.id].x = playerData.x;
            players[playerData.id].y = playerData.y;
        }
    });

    socket.on('playerHit', (hitData: { hitId: string, shooterId: string }) => {
        if (players[hitData.hitId] && board.getContext()) {
            players[hitData.hitId].destroy(board.getContext());
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
        board.drawBoard(Object.values(players), walls, shots);

        requestAnimationFrame(gameLoop);
    }

    function movementEmitter(direction: Direction) {
        socket.emit('playerMovement', { direction});
    }

    function shotEmitter(clickPosition: {x: number, y: number}) {
        const playerId = socket.id;
        if (!playerId) return;
        const player = players[playerId];
        if (!player) return;

        const dx = clickPosition.x - player.x;
        const dy = clickPosition.y - player.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        socket.emit('shoot', {
            x: (dx / length),
            y: (dy / length)
        });
    }

    gameLoop();
}