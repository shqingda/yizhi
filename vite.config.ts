import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss(), cloudflare()],
	build: { manifest: true },
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src/app"),
			"@shared": path.resolve(import.meta.dirname, "./src/shared"),
		},
	},
	server: {
		host: "0.0.0.0",
		port: 45221,
		strictPort: true,
	},
	preview: {
		host: "0.0.0.0",
		port: 45221,
		strictPort: true,
	},
});
