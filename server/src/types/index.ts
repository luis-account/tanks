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

export interface PlayerDto {
    id: string;
    username: string;
    x: number;
    y: number;
    color: string;
}

export interface Wall {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface NewPlayerDto {
    id: string;
    username: string;
    x: number;
    y: number;
    color: string;
}