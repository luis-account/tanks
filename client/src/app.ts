import { io } from "socket.io-client";
import { createGame } from "./game";

function main() {
    document.getElementById('player-submit')?.addEventListener('click', () => {
        const playerForm = document.getElementById('player-form');
        if (playerForm) {
            playerForm.style.display = 'none';
        }

        const usernameInput = document.getElementById('username-input') as HTMLInputElement;
        const colorInput = document.getElementById('color-input') as HTMLInputElement;

        startGame(usernameInput.value, colorInput.value);
    });
}

function startGame(username: string, color: string) {
    console.log("Game has started.");

    const socketUrl = 'http://localhost:3000';
    const socket = io(socketUrl);
    createGame(socket, username, color);
}

main();