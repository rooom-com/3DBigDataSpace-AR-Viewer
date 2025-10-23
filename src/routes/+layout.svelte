<script lang="ts">
	import '../app.css'

	let { children } = $props()
</script>

<div
	class="_to-slate-100 _dark:from-slate-800 _dark:to-slate-950 relative flex h-screen w-screen flex-col overflow-hidden"
>
	{@render children()}
</div>
