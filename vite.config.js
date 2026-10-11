import { defineConfig } from 'vite'

export default defineConfig({
	// Relative asset URLs, so the same build works on GitHub Pages
	// (https://<user>.github.io/<repo>/), on StackBlitz and from any sub-path.
	base: './',
	server: {
		port: 5173,
		host: true
	},
	build: {
		target: 'es2022',
		sourcemap: true,
		// MapLibre GL JS is ~1 MB minified by itself; keep it in its own long-lived chunk.
		chunkSizeWarningLimit: 1200,
		rollupOptions: {
			output: {
				manualChunks: {
					maplibre: ['maplibre-gl']
				}
			}
		}
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.test.js']
	}
})
