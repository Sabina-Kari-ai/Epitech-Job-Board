import { defineConfig } from "vite";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
    root: "public",

    server: {
        host: "127.0.0.1",

        proxy: {
            "/api": {
                target: "http://127.0.0.1:8001",
                changeOrigin: true
            },

            "/uploads": {
                target: "http://127.0.0.1:8001",
                changeOrigin: true
            }
        }
    },

    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: { input: readdirSync("public").filter(file => file.endsWith(".html")).map(file => resolve("public", file)) }
    }
});