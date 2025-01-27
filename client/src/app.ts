import { io } from "socket.io-client";
import { createGame } from "./game";

function main() {
    console.log("Game has started.");
    const socket = io('http://backend.tanks.bluevoid.ch');
    createGame(socket);
}

main();