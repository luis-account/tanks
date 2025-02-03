import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.ts', '.js'],
    },
    test: {
        environment: 'jsdom',
        testOptions: {
            files: ['**/*.test.ts'],
        },
    },
    build: {
        outDir: 'dist',
    },
});