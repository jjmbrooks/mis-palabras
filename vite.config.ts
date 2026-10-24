/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.BASE_PATH ?? '/mis-palabras/',
  build: { target: 'es2020' },
});
