<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { LayoutData } from './$types'

	let { children }: { data: LayoutData; children: Snippet } = $props()
</script>

<div class="relative flex flex-auto flex-col overflow-hidden">
	{@render children()}
</div>
