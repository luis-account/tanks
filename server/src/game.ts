import Player from './entity/player';
import { smileyFaceMap } from './map'
import { calculateNewPosition } from './movement';
import { hasCollidedAfterBounceWithBorder, hasCollidedAfterBounceWithWall, checkPlayerCollision } from './physics-logic';
import { Direction, Shot, Wall } from './types';

export class Game {
    private static BOARD_WIDTH = 1100;
    private static BOARD_HEIGHT = 700;
    private static BULLET_RADIUS = 5;
    private static INPUT_COOLDOWN_MILLISECONDS = 100;
    private players: { [id: string]: Player };
    private walls: Wall[];
    private shots: Shot[];

    private lastInputTimes: { [id: string]: number } = {};

    constructor() {
        this.players = {};
        this.walls = smileyFaceMap;
        this.shots = []
    }

    public updateGameState(deltaTime: number): { players: { [id: string]: Player }, hitPlayerIds: string[], shots: Shot[] } {
        const newPlayers = { ...this.players };
        let newShots = [...this.shots];
        let hitPlayerIds: string[] = [];

        newShots.forEach((shot, index) => {
            shot.x += shot.vx * deltaTime;
            shot.y += shot.vy * deltaTime;

            const hasCollidedWithBorder = hasCollidedAfterBounceWithBorder(shot, Game.BOARD_WIDTH, Game.BOARD_HEIGHT);
            const hasCollidedWithWall = hasCollidedAfterBounceWithWall(shot, this.walls, Game.BULLET_RADIUS);
            const newlyhitPlayerIds = checkPlayerCollision(shot, index, this.players, newShots);
            if (hasCollidedWithBorder || hasCollidedWithWall || newlyhitPlayerIds.length > 0) {
                newShots.splice(index, 1);
            }

            hitPlayerIds = [...hitPlayerIds, ...newlyhitPlayerIds];
        });

        this.shots = [...newShots];
        for (const playerId of hitPlayerIds) {
            delete newPlayers[playerId];
        }
        this.players = newPlayers;
    
        return { players: this.players, hitPlayerIds: hitPlayerIds, shots: this.shots };
    }

    public addPlayer(id: string, username: string, color: string): { [id: string]: Player } {
        const position = this.findSpawnLocationWithTrialAndError();
        this.players[id] = new Player(position.x, position.y, username, color);
        return this.players;
    }

    public removePlayer(id: string): void {
        delete this.players[id];
    }

    public addShotFromPlayer(shotPosition: { x: number; y: number; }, playerId: string): void {
        const player = this.players[playerId];
        if (player) {
            const speed = 1.15;
            const angle = Math.atan2(shotPosition.y, shotPosition.x);
            const vx = speed * Math.cos(angle);
            const vy = speed * Math.sin(angle);

            this.shots.push({
                uuid: Math.random().toString(),
                x: player.x + 10,
                y: player.y + 10,
                vx: vx,
                vy: vy,
                id: playerId,
                numberOfBounces: 0
            });
        }
    }

    public movePlayer(socketId: string, direction: Direction): { id: string, x: number, y: number } | undefined {
        const currentTime = Date.now();
        const player = this.players[socketId];
        
        if (player) {
            if (currentTime - (this.lastInputTimes[socketId] || 0) < Game.INPUT_COOLDOWN_MILLISECONDS) {
                return { id: socketId, x: this.players[socketId].x, y: this.players[socketId].y };
            }

            const { newPosition, newMovementData } = calculateNewPosition(player, direction);
            let canMove = true;

            for (const otherId in this.players) {
                if (otherId === socketId) continue;
                const otherPlayer = this.players[otherId];
                const dx = newPosition.x - otherPlayer.x;
                const dy = newPosition.y - otherPlayer.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collisionRadius = 20;

                if (distance < collisionRadius) {
                    canMove = false;
                    break;
                }
            }

            if (canMove) {
                for (const wall of this.walls) {
                    const playerRadius = 20;
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
                this.lastInputTimes[socketId] = currentTime
                return { id: socketId, x: player.x, y: player.y };
            }

        }

        return undefined;
    }

    private findSpawnLocationWithTrialAndError(): { x: number, y: number } {
        const fieldSize = 20;
        let position: { x: number, y: number };
        do {
            const fieldX = Math.floor(Math.random() * (Game.BOARD_WIDTH / fieldSize));
            const fieldY = Math.floor(Math.random() * (Game.BOARD_HEIGHT / fieldSize));
            position = {
                x: fieldX * fieldSize,
                y: fieldY * fieldSize
            };
        } while (
            Object.values(this.players).some(player => {
                const dx = position.x - player.x;
                const dy = position.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collisionRadius = 20;
                return distance < collisionRadius;
            }) ||
            this.walls.some(wall => {
                const playerRadius = 20;
                const hitX = position.x + playerRadius > wall.x && position.x < wall.x + wall.width;
                const hitY = position.y + playerRadius > wall.y && position.y < wall.y + wall.height;
                return hitX && hitY;
            })
        );
        return position;
    }

    public getPlayers() {
        return this.players;
    }

    public getWalls() {
        return this.walls;
    }
}