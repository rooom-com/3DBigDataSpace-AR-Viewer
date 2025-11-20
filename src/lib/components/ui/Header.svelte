<script lang="ts">
	import type { Snippet } from 'svelte'

	let { middle, children }: { middle?: Snippet; children?: Snippet } = $props()
</script>

<header
	class="_dark:border-slate-700 _dark:bg-slate-800 _dark:shadow-slate-900 z-10 flex items-center justify-between border-slate-300 bg-white px-4 py-2 md:px-8 md:py-4 shadow-lg shadow-slate-200/50"
>
	<a href="/" class="hidden md:block"><img class="h-8" src="/logo-3dbigdataspace.svg" alt="" /></a>
	<div class="text-base md:text-2xl">{@render middle?.()}</div>
	<div class="text-sm md:text-base">{@render children?.()}</div>
</header>
