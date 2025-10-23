<script lang="ts">
	import type { Snippet } from 'svelte'

	let { middle, children }: { middle?: Snippet; children?: Snippet } = $props()
</script>

<header
	class="_dark:border-slate-700 _dark:bg-slate-800 _dark:shadow-slate-900 z-10 flex items-center justify-between border-slate-300 bg-white px-8 py-4 shadow-lg shadow-slate-200/50"
>
	<a href="/"><img class="h-8" src="/logo-3dbigdataspace.svg" alt="" /></a>
	<div>{@render middle?.()}</div>
	<div>{@render children?.()}</div>
</header>
