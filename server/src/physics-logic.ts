import Player from "./entity/player";
import { Shot, Wall } from "./types";

export function hasCollidedAfterBounceWithBorder(shot: Shot, boardWidth: number, boardHeight: number): boolean {
    if (shot.x <= 0 || shot.x >= boardWidth) {
        if (shot.numberOfBounces > 2) {
            return true;
        } else {
            shot.vx = -shot.vx;
            shot.numberOfBounces += 1;
        }
    }

    if (shot.y <= 0 || shot.y >= boardHeight) {
        if (shot.numberOfBounces > 2) {
            return true;
        } else {
            shot.vy = -shot.vy;
            shot.numberOfBounces += 1;
        }
    }

    return false;
}

export function hasCollidedAfterBounceWithWall(shot: Shot, walls: Wall[], bulletRadius: number): boolean {
    for (const wall of walls) {
        const nextX = shot.x + shot.vx;
        const nextY = shot.y + shot.vy;

        const hitX = nextX + bulletRadius > wall.x && nextX - bulletRadius < wall.x + wall.width;
        const hitY = nextY + bulletRadius > wall.y && nextY - bulletRadius < wall.y + wall.height;

        if (hitX && hitY) {     
            if (shot.numberOfBounces > 2) {
                return true;
            }
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
            shot.numberOfBounces += 1;
        }
    };

    return false;
}

export function checkPlayerCollision(shot: Shot, index: number, players: { [id: string]: Player }, shots: Shot[]): string[] {
    const hitPlayerIds: string[] = [];
    const newShots = [...shots];

    for (const playerId in players) {
        if (playerId === shot.id && shot.numberOfBounces == 0) continue;

        const player = players[playerId];
        const dx = shot.x - player.x;
        const dy = shot.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = 20;

        if (distance < hitRadius) {
            newShots.splice(index, 1);
            hitPlayerIds.push(playerId);
            return hitPlayerIds;
        }
    }

    return hitPlayerIds;
}