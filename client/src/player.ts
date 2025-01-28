class Player {
    x: number;
    y: number;
    size: number;
    color: string;

    constructor(x: number, y: number, color: string = '#000000', size: number = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }

    update() {
        // Any logic to update the player's state can go here
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.size, this.size);
    }

    destroy(context: CanvasRenderingContext2D) {
        context.clearRect(this.x, this.y, this.size, this.size);
    }
}

export default Player;