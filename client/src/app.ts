import { io, Socket } from "socket.io-client";
import { createGame } from "./game";

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

        startGame(usernameInput.value, colorInput.value);
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

function startGame(username: string, color: string) {
    console.log("Game has started.");

    const socketUrl = 'http://localhost:3000';
    socket = io(socketUrl);
    createGame(socket, username, color);
}

main();