import { MovementData } from "../types";

class Player {
    username: string;
    x: number;
    y: number;
    color: string;
    movementData: MovementData;

    constructor(x: number, y: number, username: string, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.username = username;
        this.movementData = { direction: 'right', speed: 0 };
    }
}

export default Player;