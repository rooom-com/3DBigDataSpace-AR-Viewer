import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: true,
		allowedHosts: true
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id: string) => {
					if (id.includes('node_modules/@babylonjs/core')) {
						if (id.includes('/Shaders/') || id.includes('/ShadersWGSL/')) {
							return 'vendor-babylonjs-shaders'
						}
						if (id.includes('/Materials/')) {
							return 'vendor-babylonjs-materials'
						}
						if (id.includes('/Meshes/')) {
							return 'vendor-babylonjs-meshes'
						}
						return 'vendor-babylonjs-core'
					}
					if (id.includes('node_modules/@babylonjs/loaders')) {
						return 'vendor-babylonjs-loaders'
					}
					if (id.includes('node_modules/svelte/')) {
						return 'vendor-svelte'
					}
					if (id.includes('node_modules/@sveltejs/kit')) {
						return 'vendor-sveltekit'
					}
					if (
						id.includes('node_modules/bits-ui') ||
						id.includes('node_modules/@iconify/svelte') ||
						id.includes('node_modules/@floating-ui')
					) {
						return 'vendor-ui-components'
					}
					if (
						id.includes('node_modules/@tailwindcss') ||
						id.includes('node_modules/tailwindcss')
					) {
						return 'vendor-tailwind'
					}
					if (id.includes('node_modules')) {
						return 'vendor-common'
					}
					if (id.includes('/src/lib/components/ui/')) {
						return 'app-ui-components'
					}
					if (id.includes('/src/lib/services/')) {
						return 'app-services'
					}
					if (id.includes('/src/lib/types/')) {
						return 'app-types'
					}
					if (id.includes('/src/lib/utils/')) {
						return 'app-utils'
					}
					if (id.includes('/src/services/')) {
						return 'app-services'
					}
					return undefined
				}
			}
		},
		chunkSizeWarningLimit: 1000
	}
})
