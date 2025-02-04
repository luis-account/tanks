import { io, Socket } from "socket.io-client";
import { Game } from "./game";

let socket: Socket;

function main() {
    preloadLocalstorage();

    document.getElementById('player-submit')?.addEventListener('click', () => {
        const playerForm = document.getElementById('player-form');
        if (playerForm) {
            playerForm.style.display = 'none';
        }

        const usernameInput = document.getElementById('username-input') as HTMLInputElement;
        localStorage.setItem('username', usernameInput.value);
        const colorInput = document.getElementById('color-input') as HTMLInputElement;
        localStorage.setItem('color', colorInput.value);

        const game = new Game('http://localhost:3000', usernameInput.value, colorInput.value);
    });
}

function preloadLocalstorage() {
    const username = localStorage.getItem('username');
    const color = localStorage.getItem('color');

    if (username) {
        const usernameInput = document.getElementById('username-input') as HTMLInputElement;
        usernameInput.value = username;
    }

    if (color) {
        const colorInput = document.getElementById('color-input') as HTMLInputElement;
        colorInput.value = color;
    }
}

main();