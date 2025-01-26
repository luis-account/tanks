import { io } from "socket.io-client";
import { createGame } from "./game";

function main() {
    console.log("Game has started.");
    const socket = io('http://localhost:3000');
    createGame(socket);
}

main();