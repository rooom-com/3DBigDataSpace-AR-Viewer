<script lang="ts">
	import type { PageData } from './$types'
	import Viewer from '$lib/components/ui/Viewer.svelte'
	import Icon from '@iconify/svelte'

	let { data }: { data: PageData } = $props()
	let { modelUrl, usdzUrl, annotationsUrl, error } = data

	let enableAnnotations = $derived(!!annotationsUrl)
</script>

<svelte:head>
	<title>3D Viewer - Embedded</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if error}
	<div class="flex h-full w-full items-center justify-center bg-gradient-to-b from-slate-50 to-slate-300">
		<div class="max-w-md text-center p-6">
			<Icon icon="tabler:alert-circle" class="mx-auto mb-4 size-12 text-red-500" />
			<h3 class="mb-2 text-lg font-semibold text-slate-800">Unable to Load Viewer</h3>
			<p class="mb-4 text-slate-600">{error}</p>
			<p class="text-sm text-slate-500">
				Please provide a valid model URL using the <code class="bg-slate-200 px-1 rounded">?model=</code> query parameter.
			</p>
		</div>
	</div>
{:else if modelUrl}
	<div class="h-full w-full">
		<Viewer
			file={modelUrl}
			usdzFile={usdzUrl || undefined}
			enableAnnotations={enableAnnotations}
			annotationsUrl={annotationsUrl || undefined}
		/>
	</div>
{/if}

