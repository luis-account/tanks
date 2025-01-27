import { io } from "socket.io-client";
import { createGame } from "./game";

function main() {
    console.log("Game has started.");
    const socketUrl = 'http://localhost:3000';
    const socket = io(socketUrl);
    createGame(socket);
}

main();