export interface PlayerData {
    id: string;
    x: number;
    y: number;
}

export interface GameState {
    players: PlayerData[];
}