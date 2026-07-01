import { defineConfig, loadEnv } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var apiTarget = env.VITE_API_TARGET || 'http://backend:8080';
    return {
        plugins: [react()],
        test: {
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});
