import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// When deploying to GitHub Pages the site will be served from /starwars-card-games/
// so we set the base path accordingly. Locally (dev) Vite handles this transparently.
export default defineConfig({
  base: '/starwars-card-games/',
  plugins: [react()],
});
