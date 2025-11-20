<script lang="ts">
	import { onMount } from 'svelte'
	import Icon from '@iconify/svelte'
	import { formatDate, formatFileSize } from '$lib/utils'

	let { record } = $props()
	let isOpen = $state(false)
	let isMobile = $state(false)

	function checkMobile() {
		const wasMobile = isMobile
		isMobile = window.innerWidth < 768

		if (!isMobile) {
			isOpen = true
		} else if (!wasMobile && isMobile) {
			isOpen = false
		}
	}

	function toggleSidebar() {
		isOpen = !isOpen
	}

	function closeSidebar() {
		if (isMobile) {
			isOpen = false
		}
	}

	onMount(() => {
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	})
</script>

<svelte:window on:resize={checkMobile} />

{#if isMobile}
	<button
		class="fixed left-4 top-14 z-30 flex size-10 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
		onclick={toggleSidebar}
		aria-label="Toggle sidebar"
	>
		<Icon icon={isOpen ? 'tabler:x' : 'tabler:menu-2'} class="size-5" />
	</button>
{/if}

{#if isMobile && isOpen}
	<div
		class="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
		onclick={closeSidebar}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				closeSidebar()
			}
		}}
		role="button"
		tabindex="0"
		aria-label="Close sidebar"
	></div>
{/if}

<aside
	class="h-full w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out {isMobile ? 'fixed left-0 top-12 h-[calc(100vh-3rem)] z-30' : 'relative z-10'} {isOpen ? 'translate-x-0' : '-translate-x-full'}"
>
	<div class="flex h-full flex-col overflow-y-auto p-6">
		{#if isMobile}
			<button
				class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				onclick={closeSidebar}
				aria-label="Close sidebar"
			>
				<Icon icon="tabler:x" class="size-4" />
			</button>
		{/if}

		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold text-slate-800 mb-3">Record Details</h2>
				<div class="space-y-3">
					<div>
						<h3 class="text-sm font-medium text-slate-600 mb-1">Title</h3>
						<p class="text-sm text-slate-800">{record.title}</p>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<h3 class="text-sm font-medium text-slate-600 mb-1">ID</h3>
							<p class="text-sm text-slate-800 font-mono">{record.id}</p>
						</div>
						<div>
							<h3 class="text-sm font-medium text-slate-600 mb-1">Status</h3>
							<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
								{record.status}
							</span>
						</div>
					</div>
					<div>
						<h3 class="text-sm font-medium text-slate-600 mb-1">Version</h3>
						<p class="text-sm text-slate-800">{record.version}</p>
					</div>
					{#if record.glbSize}
						<div>
							<h3 class="text-sm font-medium text-slate-600 mb-1">3D Model Size</h3>
							<p class="text-sm text-slate-800 flex items-center">
								<Icon icon="tabler:file-3d" class="size-4 mr-1 text-slate-500" />
								{formatFileSize(record.glbSize)}
							</p>
						</div>
					{/if}
				</div>
			</div>

			<div>
				<h2 class="text-lg font-semibold text-slate-800 mb-3">Dates</h2>
				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<h3 class="text-sm font-medium text-slate-600 mb-1">Created</h3>
							<p class="text-sm text-slate-800">{formatDate(record.created)}</p>
						</div>
						<div>
							<h3 class="text-sm font-medium text-slate-600 mb-1">Updated</h3>
							<p class="text-sm text-slate-800">{formatDate(record.updated)}</p>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h2 class="text-lg font-semibold text-slate-800 mb-3">Statistics</h2>
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-lg bg-blue-50 p-3">
						<div class="flex items-center">
							<Icon icon="tabler:eye" class="size-4 text-blue-600 mr-2" />
							<div>
								<p class="text-xs text-blue-600 font-medium">Views</p>
								<p class="text-lg font-semibold text-blue-800">{record.stats?.views || 0}</p>
							</div>
						</div>
					</div>
					<div class="rounded-lg bg-green-50 p-3">
						<div class="flex items-center">
							<Icon icon="tabler:download" class="size-4 text-green-600 mr-2" />
							<div>
								<p class="text-xs text-green-600 font-medium">Downloads</p>
								<p class="text-lg font-semibold text-green-800">{record.stats?.downloads || 0}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{#if record.keywords && record.keywords.length > 0}
				<div>
					<h2 class="text-lg font-semibold text-slate-800 mb-3">Keywords</h2>
					<div class="flex flex-wrap gap-2">
						{#each record.keywords as keyword}
							<span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
								<Icon icon="tabler:tag" class="size-3 mr-1" />
								{keyword}
							</span>
						{/each}
					</div>
				</div>
			{/if}


		</div>
	</div>
</aside>

<style>
	aside {
		box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
	}
</style>
