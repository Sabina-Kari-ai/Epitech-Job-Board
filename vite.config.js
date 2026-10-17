import { defineConfig } from "vite";
import { resolve } from "node:path";

const htmlPages = [
    "index.html",
    "job.html",
    "apply.html",
    "companies.html",
    "app.html",
    "login.html",
    "forgot-password.html",
    "reset-password.html",
    "register.html",
    "company-dashboard.html",
    "profile.html",
    "alerts.html",
    "admin.html",
    "mail.html"
];

export default defineConfig({
root: "public",
server: {
host: "127.0.0.1",
proxy: { '/api': {target:'http://127.0.0.1:8001',changeOrigin:true}, '/uploads': {target:'http://127.0.0.1:8001',changeOrigin:true} }
},
build: {
rollupOptions: {
input: htmlPages.map((page) => resolve(process.cwd(), "public", page))
},
outDir: "../dist",
emptyOutDir: true
}
});
