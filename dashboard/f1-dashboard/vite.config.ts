import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

const basePath = process.env.PUBLIC_BASE_PATH ?? '/livetiming';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html'
			}),
			paths: {
				base: basePath as `/${string}`
			}
		})
	],

	server: {
		proxy: {
			'/livetiming/api': {
			target: 'http://127.0.0.1:8000',
			changeOrigin: true,
			rewrite: (path) => path.replace(/^\/livetiming/, '')
			},
			'/livetiming/ws': {
			target: 'ws://127.0.0.1:8000',
			ws: true,
			changeOrigin: true,
			rewrite: (path) => path.replace(/^\/livetiming/, '')
			}
		}
	},

	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},

	define: {
		'import.meta.env.VITE_DASHBOARD_BASE_PATH': JSON.stringify(basePath)
	},
});
