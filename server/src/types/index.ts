export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MovementData {
    direction: Direction;
    speed: number;
}

export interface Position {
    x: number,
    y: number
}

export interface Shot {
    uuid: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    id: string;
    hasBounced: boolean;
}