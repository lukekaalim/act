import { defineConfig } from 'vite';
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  build: {
    modulePreload: false
  },
  plugins: [webExtension({
    browser: 'firefox'
  })],
});