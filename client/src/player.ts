class Player {
    x: number;
    y: number;
    size: number;
    color: string;

    constructor(x: number, y: number, size: number = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
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
}

export default Player;