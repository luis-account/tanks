import Player from "./player";

export class Hud {
    private playerList: HTMLElement;
    private rejoinButton: HTMLElement;

    constructor() {
        this.playerList = document.getElementById('player-list')!;
        this.rejoinButton = document.getElementById('revive')!;
    }

    public refreshPlayerList(players: Player[]) {
        this.playerList.innerHTML = '';
        players.forEach((player) => 
            this.playerList.appendChild(this.createPlayerEntry(player)));
    }

    public showRejoinButton() {
        this.rejoinButton.style.display = 'block';
    }

    public hideRejoinButton() {
        this.rejoinButton.style.display = 'none';
    }

    private createPlayerEntry(player: Player): HTMLElement {
        const playerEntry = document.createElement('div');
        playerEntry.className = 'flex items-center mb-2 mr-8';

        const colorSquare = document.createElement('div');
        colorSquare.className = 'w-4 h-4 mr-1';
        colorSquare.style.backgroundColor = player.color;

        const playerName = document.createElement('span');
        playerName.textContent = player.username;

        playerEntry.appendChild(colorSquare);
        playerEntry.appendChild(playerName);
        return playerEntry;
    }
}