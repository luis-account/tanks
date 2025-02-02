import Player from "./player";
import { Shot, Wall } from "./types";

export class Board {
    public static CANVAS_WIDTH = 1100;
    public static CANVAS_HEIGHT = 700;

    private static WALL_COLOR = '#000000';
    
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor(parentElement: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = Board.CANVAS_WIDTH;
        this.canvas.height = Board.CANVAS_HEIGHT; 

        const possiblyNullContext = this.canvas.getContext('2d');
        if (!possiblyNullContext) {
            throw new Error('Canvas context not found');
        }
        this.context = possiblyNullContext;
        parentElement.appendChild(this.canvas);
    }

    private drawPlayers(players: Player[]) {
        players.forEach((player) => {
            this.context.fillStyle = player.color;
            this.context.fillRect(player.x, player.y, player.size, player.size);
        });
    }

    private drawWalls(walls: Wall[]) {
        walls.forEach((wall) => {
            this.context.fillStyle = Board.WALL_COLOR;
            this.context.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
    }

    private drawShots(shots: Shot[]) {
        shots.forEach((shot) => {
            this.context.beginPath();
            this.context.arc(shot.x, shot.y, 5, 0, 2 * Math.PI);
            this.context.fillStyle = shot.color;
            this.context.fill();
        });
    }

    public drawBoard(players: Player[], walls: Wall[], shots: Shot[]) {
        this.context.clearRect(0, 0, Board.CANVAS_WIDTH, Board.CANVAS_HEIGHT);

        this.drawPlayers(players);
        this.drawWalls(walls);
        this.drawShots(shots);
    }


    public getContext(): CanvasRenderingContext2D {
        return this.context;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}