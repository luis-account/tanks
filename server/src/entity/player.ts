import { MovementData } from "../types";

class Player {
    x: number;
    y: number;
    color: string;
    movementData: MovementData;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        this.movementData = { direction: 'right', speed: 0 };
    }
}

export default Player;