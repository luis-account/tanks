export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MovementData {
    direction: Direction;
    speed: number;
}

export interface Position {
    x: number,
    y: number
}