export interface PlayerData {
    id: string;
    username: string;
    x: number;
    y: number;
    color: string;
}

export interface GameState {
    players: PlayerData[];
}

export type Direction = 'up' | 'down' | 'left' | 'right';