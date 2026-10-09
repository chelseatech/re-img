import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: {
      // Tauri watches Rust sources itself; Vite must not watch locked build executables.
      ignored: ['**/src-tauri/**', '**/target/**'],
    },
  },
  clearScreen: false,
});
