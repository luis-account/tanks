import { Direction } from "./types";

type KnownKeyboardInputs = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'w' | 'a' | 's' | 'd';

export class UserInteractionListener {
    private currentDirection: Direction | null = null;
    private movementInterval: NodeJS.Timeout | null = null;

    private userMovedCallback;
    private lastInputTime;

    constructor(userMovedCallback: (direction: Direction) => void) {
        this.userMovedCallback = userMovedCallback;
        this.lastInputTime = 0;

        this.registerEventListeners();
    }

    onKeydown(key: KnownKeyboardInputs) {       
        switch (key) {
            case 'ArrowUp':
            case 'w':
                if (this.currentDirection !== 'up') {
                    this.currentDirection = 'up';
                    this.debouncedUserMovedCallback('up');
                }
                break;
            case 'ArrowDown':
            case 's':
                if (this.currentDirection !== 'down') {
                    this.currentDirection = 'down';
                    this.debouncedUserMovedCallback('down');
                }
                break;
            case 'ArrowLeft':
            case 'a':
                if (this.currentDirection !== 'left') {
                    this.currentDirection = 'left';
                    this.debouncedUserMovedCallback('left');
                }
                break;
            case 'ArrowRight':
            case 'd':
                if (this.currentDirection !== 'right') {
                    this.currentDirection = 'right';
                    this.debouncedUserMovedCallback('right');
                }
                break;
        }
    }

    onKeyup(anyKey: string) {
        // TODO: what is a better way to typecheck here?
        const isInputKey = ['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'].includes(anyKey);
        if (isInputKey) {
            this.currentDirection = null;
            if (this.movementInterval) {
                clearInterval(this.movementInterval);
            }
        }
    }

    private debouncedUserMovedCallback(direction: Direction) {
        const inputCooldownMilliseconds = 50;

        if (this.movementInterval) {
            clearInterval(this.movementInterval);
        }

        this.movementInterval = setInterval(() => {
            const currentTime = Date.now();
            if (currentTime - this.lastInputTime >= inputCooldownMilliseconds) {
                this.lastInputTime = currentTime;
                this.userMovedCallback(direction);
            }
        }, inputCooldownMilliseconds);
    }

    private registerEventListeners() {
        window.addEventListener('keydown', (event) => this.onKeydown(event.key as KnownKeyboardInputs));
        window.addEventListener('keyup', (event) => this.onKeyup(event.key));
    }
}