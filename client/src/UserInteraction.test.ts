import { expect, test, vi } from 'vitest'
import { UserInteractionListener } from './UserInteractionListener';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('onKeydown should send corresponding direction', async () => {
    const mockCallback = vi.fn();
    const listener = new UserInteractionListener(mockCallback, () => {}, new HTMLCanvasElement());
    
    listener.onKeydown('ArrowUp');
    await sleep(50);
    listener.onKeydown('ArrowDown');
    await sleep(50);

    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenNthCalledWith(1, 'up');
    expect(mockCallback).toHaveBeenNthCalledWith(2, 'down');
});

test('onKeydown should only send only one event when multiple button pressed quickly', async () => {
    const mockCallback = vi.fn();
    const listener = new UserInteractionListener(mockCallback, () => {}, new HTMLCanvasElement());

    listener.onKeydown('ArrowUp');
    listener.onKeydown('ArrowLeft');
    listener.onKeydown('ArrowDown');
    listener.onKeydown('ArrowRight');
    await sleep(50);

    expect(mockCallback).toHaveBeenCalledExactlyOnceWith('right');
});

test('onKeydown should continue in same direction until key released', async () => {
    const mockCallback = vi.fn();
    const listener = new UserInteractionListener(mockCallback, () => {}, new HTMLCanvasElement());

    listener.onKeydown('ArrowUp');
    await sleep(175);


    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(mockCallback).toHaveBeenCalledWith('up');
});

test('onKeydown quickrelease of button should not trigger movement', async () => {
    const mockCallback = vi.fn();
    const listener = new UserInteractionListener(mockCallback, () => {}, new HTMLCanvasElement());

    listener.onKeydown('ArrowUp');
    listener.onKeyup('ArrowUp');
    await sleep(75);


    expect(mockCallback).not.toHaveBeenCalledWith('up');
});