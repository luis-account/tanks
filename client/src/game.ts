import { Board } from './board';
import Player from './player';
import { Direction, PlayerData as PlayerDto, Shot, ShotDto, Wall } from './types';
import { io, Socket } from 'socket.io-client';
import { UserInteractionListener } from './UserInteractionListener';
import { Hud } from './hud';

export class Game {
    private board;
    private hud;
    private userInteractionListener;
    
    private players: { [id: string]: Player } = {};
    private shots: Shot[] = [];
    private walls: Wall[] = [];
    private socket: Socket;

    constructor(socketUrl: string, username: string, color: string) {
        this.socket = io(socketUrl);;

        this.board = new Board(document.getElementById('content')!);
        this.hud = new Hud();
        this.userInteractionListener = new UserInteractionListener(this.movementEmitter.bind(this), this.shotEmitter.bind(this), this.board.getCanvas());

        // TODO: extract this listener
        document.getElementById('revive')?.addEventListener('click', () => {
            this.hud.hideRejoinButton();
            this.socket.emit('registerPlayer', { username: username, color: color });
        });

        this.registerSocketListeners();
        this.socket.emit('registerPlayer', { username: username, color: color });
        this.gameLoop();
    }

    private gameLoop() {
        this.board.drawBoard(Object.values(this.players), this.walls, this.shots);
        this.hud.refreshPlayerList(Object.values(this.players));
        requestAnimationFrame(() => this.gameLoop());
    }

    private registerSocketListeners() {
        this.socket.on('walls', (walls: Wall[]) => this.walls = walls);
        this.socket.on('currentPlayers', (playerDtos: PlayerDto[]) => this.players = this.mapPlayerDtoToPlayers(playerDtos));
        this.socket.on('playerMoved', (playerDto: PlayerDto) => this.updatePlayerPositionIfPresent(playerDto));
        this.socket.on('playerHit', (hitData: { hitId: string }) => this.removeHitPlayerIfPresent(hitData.hitId));
        this.socket.on('shotsUpdate', (updatedShots: ShotDto[]) => this.shots = this.mapShotDtosToShots(updatedShots));
    }

    private removeHitPlayerIfPresent(hitId: string) {       
        if (!this.players[hitId]) return;
        delete this.players[hitId];      

        if (hitId === this.socket.id) {
            this.hud.showRejoinButton();
        }
    }

    private updatePlayerPositionIfPresent(playerDto: PlayerDto) {
        if (!this.players[playerDto.id]) return;
        this.players[playerDto.id].updatePosition(playerDto.x, playerDto.y);
    }

    private mapPlayerDtoToPlayers(playerDtos: PlayerDto[]): { [id: string]: Player } {       
        const players: { [id: string]: Player } = {};
        playerDtos.forEach((playerData) => {
            players[playerData.id] = new Player(playerData.username, playerData.x, playerData.y, playerData.color);
        });
        return players;
    }

    private mapShotDtosToShots(shotDtos: ShotDto[]): Shot[] {
        return shotDtos.map((shot) => ({ x: shot.x, y: shot.y, color: this.players[shot.id]?.color || 'red' }));
    }

    private movementEmitter(direction: Direction) {
        this.socket.emit('playerMovement', { direction});
    }

    private shotEmitter(clickPosition: {x: number, y: number}) {
        const playerId = this.socket.id;
        if (!playerId) return;
        const player = this.players[playerId];
        if (!player) return;

        const dx = clickPosition.x - player.x;
        const dy = clickPosition.y - player.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        this.socket.emit('shoot', { x: (dx / length), y: (dy / length)});
    }
}