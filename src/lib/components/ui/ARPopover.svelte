<script lang="ts">
	import { onMount } from 'svelte'
	import Icon from '@iconify/svelte'
	import QRCode from 'qrcode'

	let { glbUrl, usdzUrl }: {
		glbUrl?: string;
		usdzUrl?: string;
	} = $props()

	let showPopover = $state(false)
	let isDesktop = $state(false)
	let qrCodeDataUrl = $state('')
	let currentUrl = $state('')

	function detectDevice() {
		const userAgent = navigator.userAgent

		// Nur auf Desktop-Geräten anzeigen
		if (!/iPad|iPhone|iPod|Android/i.test(userAgent)) {
			isDesktop = true
		}
	}

	function togglePopover() {
		showPopover = !showPopover
	}

	async function generateQRCode() {
		if (typeof window !== 'undefined') {
			currentUrl = window.location.href
			try {
				qrCodeDataUrl = await QRCode.toDataURL(currentUrl, {
					width: 200,
					margin: 2,
					color: {
						dark: '#1e293b',
						light: '#ffffff'
					}
				})
			} catch (err) {
				console.error('Error generating QR code:', err)
			}
		}
	}

	function closePopover() {
		showPopover = false
	}

	onMount(() => {
		detectDevice()
		if (isDesktop) {
			generateQRCode()
		}
	})

	// iOS ist supported wenn USDZ vorhanden ist, oder GLB (iOS 12+ seit 2018)
	let iosSupported = $derived(!!(usdzUrl || glbUrl))
</script>

{#if isDesktop}
	<div class="absolute bottom-4 right-4" style="z-index: 99999;">
		<!-- Button -->
		<button
			class="flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
			onclick={togglePopover}
			aria-label="View AR on mobile"
			title="AR auf Smartphone"
			type="button"
		>
			<Icon icon="tabler:augmented-reality-2" class="size-6" aria-hidden="true" />
		</button>

		<!-- Popover -->
		{#if showPopover}
			<div
				class="absolute bottom-16 right-0 w-80 rounded-lg bg-white p-4 shadow-xl border border-slate-200"
				role="dialog"
				aria-modal="false"
			>
				<button
					class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
					onclick={closePopover}
					aria-label="Close"
				>
					<Icon icon="tabler:x" class="size-4" />
				</button>

				<div class="text-center">
					<div class="mb-3 flex justify-center">
						<Icon icon="tabler:device-mobile" class="size-10 text-sky-600" />
					</div>

					<h3 class="mb-2 text-lg font-bold text-slate-800">
						AR auf dem Smartphone
					</h3>

					<p class="mb-3 text-xs text-slate-600">
						Scannen Sie den QR-Code mit Ihrem Smartphone
					</p>

					{#if qrCodeDataUrl}
						<div class="mb-3 flex justify-center">
							<img src={qrCodeDataUrl} alt="QR Code" class="rounded-lg border-2 border-slate-200" style="width: 160px; height: 160px;" />
						</div>
					{/if}

					<div class="space-y-2 text-left">
						<p class="text-xs font-semibold text-slate-700">Unterstützte Geräte:</p>

						<div class="flex items-center gap-2 rounded-lg bg-slate-50 p-2 {iosSupported ? '' : 'opacity-50'}">
							<Icon
								icon="tabler:brand-apple"
								class="size-5 {iosSupported ? 'text-slate-700' : 'text-slate-400'}"
							/>
							<div class="flex-1">
								<p class="text-xs font-medium {iosSupported ? 'text-slate-800' : 'text-slate-500 line-through'}">
									iOS (iPhone/iPad)
								</p>
								<p class="text-[10px] {iosSupported ? 'text-slate-600' : 'text-slate-400'}">
									{#if usdzUrl}
										AR Quick Look (USDZ)
									{:else if glbUrl}
										AR Quick Look (GLB)
									{:else}
										Keine AR-Datei verfügbar
									{/if}
								</p>
							</div>
							{#if iosSupported}
								<Icon icon="tabler:check" class="size-4 text-green-600" />
							{:else}
								<Icon icon="tabler:x" class="size-4 text-red-400" />
							{/if}
						</div>

						<div class="flex items-center gap-2 rounded-lg bg-slate-50 p-2 {glbUrl ? '' : 'opacity-50'}">
							<Icon
								icon="tabler:brand-android"
								class="size-5 {glbUrl ? 'text-slate-700' : 'text-slate-400'}"
							/>
							<div class="flex-1">
								<p class="text-xs font-medium {glbUrl ? 'text-slate-800' : 'text-slate-500 line-through'}">
									Android
								</p>
								<p class="text-[10px] {glbUrl ? 'text-slate-600' : 'text-slate-400'}">
									{glbUrl ? 'Scene Viewer' : 'Keine GLB-Datei'}
								</p>
							</div>
							{#if glbUrl}
								<Icon icon="tabler:check" class="size-4 text-green-600" />
							{:else}
								<Icon icon="tabler:x" class="size-4 text-red-400" />
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

