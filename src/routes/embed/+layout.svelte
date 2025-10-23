<script lang="ts">
	import type { Snippet } from 'svelte'

	let { children }: { children: Snippet } = $props()
</script>

<!-- Minimal layout for embedded viewer - no headers, footers, or navigation -->
<div class="h-full w-full overflow-hidden">
	{@render children()}
</div>

