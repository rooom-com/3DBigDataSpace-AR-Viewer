<script lang="ts">
	import { onMount } from 'svelte'
	import Icon from '@iconify/svelte'

	let { glbUrl, usdzUrl }: {
		glbUrl?: string;
		usdzUrl?: string;
	} = $props()

	let showButton = $state(false)
	let deviceType: 'ios' | 'android' | 'desktop' = $state('desktop')
	let arLink: HTMLAnchorElement | null = $state(null)

	function detectDevice() {
		const userAgent = navigator.userAgent

		if (/iPad|iPhone|iPod/.test(userAgent)) {
			deviceType = 'ios'
			showButton = !!(usdzUrl || glbUrl)
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
		if (deviceType === 'ios' && arLink) {
			arLink.click()
		} else if (deviceType === 'android' && glbUrl) {
			openAndroidSceneViewer(glbUrl)
		}
	}

	function openAndroidSceneViewer(url: string) {
		const titleElement = document.querySelector('h1')
		const title = titleElement?.textContent || 'AR Model'
		const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(url)}&mode=ar_preferred&title=${encodeURIComponent(title)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(url)}&mode=ar_preferred;end;`

		window.location.href = intentUrl
	}

	onMount(() => {
		detectDevice()
	})
</script>

{#if showButton}
	{#if deviceType === 'ios'}
		<a
			bind:this={arLink}
			href={usdzUrl || glbUrl}
			rel="ar"
			style="display: none;"
		>
			<img />
		</a>
	{/if}
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

