import Player from "./entity/player";
import { Direction, MovementData, Position } from "./types";

/*
    This functions emulates realistic movement of a tank in a 2D space.
*/
export function calculateNewPosition(player: Player, direction: Direction): {newPosition: Position, newMovementData: MovementData} {
    const { x, y } = {x: player.x, y: player.y};
    const newMovementData = player.movementData;

    let newPosition: Position;
    switch (direction) {
        case 'up':
            newPosition = { x, y: y - 5 };
            break;
        case 'down':
            newPosition = { x, y: y + 5 };
            break;
        case 'left':
            newPosition = { x: x - 5, y };
            break;
        case 'right':
            newPosition = { x: x + 5, y };
            break;
        default:
            newPosition = {x: x, y: y};
            break;
    }

    return { newPosition, newMovementData };
}