class Player {
    username: string;
    x: number;
    y: number;
    size: number;
    color: string;

    constructor(username: string, x: number, y: number, color: string = '#0000FF', size: number = 20) {
        this.username = username;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export default Player;