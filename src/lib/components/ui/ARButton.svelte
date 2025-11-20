<script lang="ts">
	import { onMount } from 'svelte'
	import Icon from '@iconify/svelte'

	let { glbUrl, usdzUrl }: {
		glbUrl?: string;
		usdzUrl?: string;
	} = $props()

	let showButton = $state(false)
	let deviceType: 'ios' | 'android' | 'desktop' = $state('desktop')

	function detectDevice() {
		const userAgent = navigator.userAgent

		if (/iPad|iPhone|iPod/.test(userAgent)) {
			deviceType = 'ios'
			showButton = !!usdzUrl
			return
		}

		if (/Android/.test(userAgent)) {
			deviceType = 'android'
			showButton = !!glbUrl
			return
		}

		deviceType = 'desktop'
		showButton = false
	}

	function handleARClick() {
		if (deviceType === 'ios' && usdzUrl) {
			openIOSQuickLook(usdzUrl)
		} else if (deviceType === 'android' && glbUrl) {
			openAndroidSceneViewer(glbUrl)
		}
	}

	function openIOSQuickLook(url: string) {
		const link = document.createElement('a')
		link.href = url
		link.rel = 'ar'
		link.download = 'model.usdz'
		link.setAttribute('data-ar', 'true')
		link.type = 'model/vnd.usdz+zip'

		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	function openAndroidSceneViewer(url: string) {
		const titleElement = document.querySelector('h1')
		const title = titleElement?.textContent || 'AR Model'
		const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(url)}&mode=ar_only&title=${encodeURIComponent(title)}`

		window.location.href = sceneViewerUrl
	}

	onMount(() => {
		detectDevice()
	})
</script>

{#if showButton}
	<div class="absolute bottom-4 right-4" style="z-index: 99999;">
		<button
			class="ar-button flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
			onclick={handleARClick}
			aria-label="View in Augmented Reality"
			title="View in AR"
			type="button"
		>
			<Icon icon="tabler:augmented-reality" class="size-6" aria-hidden="true" />
		</button>
	</div>
{/if}

<style>
	.ar-button {
		-webkit-tap-highlight-color: transparent;
	}
</style>

