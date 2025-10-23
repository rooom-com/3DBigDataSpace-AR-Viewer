<script lang="ts">
	import Icon from '@iconify/svelte'
	import { onMount } from 'svelte'

	let {
		src,
		alt = '',
		class: className = '',
		fallbackSrc = '/placeholder-image.svg'
	}: {
		src: string
		alt?: string
		class?: string
		fallbackSrc?: string
	} = $props()

	let isLoading = $state(true)
	let hasError = $state(false)
	let shouldLoad = $state(false)
	let imgElement = $state<HTMLImageElement | null>(null)
	let containerElement = $state<HTMLDivElement | null>(null)

	const imageCache = new Map<string, boolean>()

	onMount(() => {
		if (imageCache.has(src)) {
			isLoading = false
			shouldLoad = true
			return
		}

		if (containerElement) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !shouldLoad) {
							shouldLoad = true
							loadImage()
							observer.unobserve(entry.target)
						}
					})
				},
				{ rootMargin: '50px' }
			)
			observer.observe(containerElement)

			return () => observer.disconnect()
		}
	})

	function loadImage() {
		if (imageCache.has(src)) {
			isLoading = false
			return
		}

		const img = new Image()
		img.onload = () => {
			imageCache.set(src, true)
			isLoading = false
			hasError = false
		}
		img.onerror = () => {
			isLoading = false
			hasError = true
		}
		img.src = src
	}

	function handleImageError() {
		hasError = true
		isLoading = false
	}

	function handleImageLoad() {
		isLoading = false
		hasError = false
		imageCache.set(src, true)
	}
</script>

<div class="relative {className}" bind:this={containerElement}>
	{#if !shouldLoad || isLoading}
		<div class="flex items-center justify-center bg-slate-100 {className}">
			{#if shouldLoad}
				<Icon icon="tabler:loader-2" class="size-4 animate-spin text-slate-400" />
			{:else}
				<Icon icon="tabler:photo" class="size-4 text-slate-400" />
			{/if}
		</div>
	{:else if hasError}
		<img
			src={fallbackSrc}
			{alt}
			class={className}
		/>
	{:else}
		<img
			bind:this={imgElement}
			{src}
			{alt}
			class={className}
			onload={handleImageLoad}
			onerror={handleImageError}
		/>
	{/if}
</div>
