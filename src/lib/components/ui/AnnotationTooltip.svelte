<script lang="ts">
	import type { Annotation3D } from '$lib/types/annotations'

	interface Props {
		annotation: Annotation3D | null
		position: { x: number; y: number }
		visible: boolean
	}

	let { annotation, position, visible }: Props = $props()

	function formatContent(content: string, format: string): string {
		if (format === 'html') {
			return content
		} else if (format === 'markdown') {
			return content
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/\n/g, '<br>')
		}
		return content
	}
</script>

{#if visible && annotation}
	<div
		class="annotation-tooltip fixed z-50 max-w-sm bg-white rounded-lg shadow-lg border border-slate-200 p-3 pointer-events-none"
		style="left: {position.x + 10}px; top: {position.y - 10}px;"
	>
		{#if annotation.content.title}
			<h4 class="font-medium text-slate-900 text-sm leading-tight mb-2">
				{annotation.content.title}
			</h4>
		{/if}

		<div class="text-sm text-slate-700 leading-relaxed">
			{#if annotation.content.format === 'html'}
				{@html formatContent(annotation.content.description, annotation.content.format)}
			{:else}
				<p>{annotation.content.description}</p>
			{/if}
		</div>

		<div class="absolute -left-1 top-4 w-2 h-2 bg-white border-l border-b border-slate-200 transform rotate-45"></div>
	</div>
{/if}

<style>
	.annotation-tooltip {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
