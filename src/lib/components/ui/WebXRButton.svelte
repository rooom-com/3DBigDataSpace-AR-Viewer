<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { WebXRSupport } from '$lib/utils/webxr'

	/**
	 * WebXR AR Button Component
	 * 
	 * Displays a button to enter WebXR AR mode on supported devices.
	 * This component is specifically for in-browser AR using the WebXR API,
	 * which is currently only supported on Android Chrome (not iOS Safari).
	 */

	let {
		webxrSupport,
		isInXR = false,
		onEnterXR,
		onExitXR
	}: {
		webxrSupport: WebXRSupport | null
		isInXR?: boolean
		onEnterXR: () => Promise<boolean>
		onExitXR: () => Promise<void>
	} = $props()

	let isLoading = $state(false)
	let errorMessage = $state('')

	// Determine if button should be shown
	const shouldShow = $derived(webxrSupport?.supportsAR ?? false)

	async function handleClick() {
		if (isLoading) return

		errorMessage = ''
		isLoading = true

		try {
			if (isInXR) {
				// Exit XR mode
				await onExitXR()
			} else {
				// Enter XR mode
				const success = await onEnterXR()
				if (!success) {
					errorMessage = 'Failed to start AR. Please try again.'
				}
			}
		} catch (err) {
			console.error('WebXR button error:', err)
			errorMessage = 'An error occurred. Please try again.'
		} finally {
			isLoading = false
		}
	}

	// Get button text based on state
	const buttonText = $derived(() => {
		if (isLoading) return 'Loading...'
		if (isInXR) return 'Exit AR'
		return 'View in AR (WebXR)'
	})

	// Get button icon based on state
	const buttonIcon = $derived(() => {
		if (isInXR) return 'mdi:close-circle-outline'
		return 'mdi:augmented-reality'
	})
</script>

{#if shouldShow}
	<div class="webxr-button-container">
		<button
			class="webxr-button"
			class:active={isInXR}
			class:loading={isLoading}
			onclick={handleClick}
			disabled={isLoading}
			aria-label={isInXR ? 'Exit AR mode' : 'Enter AR mode'}
		>
			<Icon icon={buttonIcon()} width="24" height="24" />
			<span>{buttonText()}</span>
		</button>

		{#if errorMessage}
			<div class="error-message" role="alert">
				{errorMessage}
			</div>
		{/if}

		{#if !isInXR && webxrSupport?.isAndroid}
			<div class="info-message">
				<Icon icon="mdi:information-outline" width="16" height="16" />
				<span>In-browser AR powered by WebXR</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.webxr-button-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.webxr-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
	}

	.webxr-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.webxr-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.webxr-button.active {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.webxr-button.loading {
		opacity: 0.7;
		cursor: wait;
	}

	.webxr-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.error-message {
		padding: 0.5rem;
		background-color: #fee;
		color: #c33;
		border-radius: 4px;
		font-size: 0.875rem;
		text-align: center;
	}

	.info-message {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background-color: #e3f2fd;
		color: #1976d2;
		border-radius: 4px;
		font-size: 0.875rem;
		justify-content: center;
	}
</style>

