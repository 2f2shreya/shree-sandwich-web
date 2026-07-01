import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Using relative paths for seamless deployment on Vercel, Netlify, and GitHub Pages
  build: {
    outDir: 'dist',
  }
});
