<script lang="ts">
import Icon from '@iconify/svelte'
import type { PageData } from './$types'
import { formatDate, filterZenodoRecord } from '$lib/utils'
import Header from '$lib/components/ui/Header.svelte'
import Footer from '$lib/components/ui/Footer.svelte'
import CachedThumbnail from '$lib/components/ui/CachedThumbnail.svelte'
import { goto } from '$app/navigation'
import { saveRecordsState, loadRecordsState } from '$lib/stores/recordsState'
import { onMount } from 'svelte'

function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
	let timeoutId: ReturnType<typeof setTimeout> | null = null
	let lastExecTime = 0

	return ((...args: any[]) => {
		const currentTime = Date.now()

		if (currentTime - lastExecTime > delay) {
			func(...args)
			lastExecTime = currentTime
		} else {
			if (timeoutId) clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				func(...args)
				lastExecTime = Date.now()
			}, delay - (currentTime - lastExecTime))
		}
	}) as T
}

type FilteredRecord = {
	id: string
	created: string
	updated: string
	title: string
	keywords?: string[]
	version?: string
	doi?: string
	glb?: string
	glbSize?: number
	usdz?: string
	usdzSize?: number
	status: string
	thumbnails?: any
	bestThumbnail?: string
	stats: {
		downloads?: number
		views?: number
	}
}

let { data }: { data: PageData } = $props()
let { result, error } = data

let filterName = $state('')
let sortBy = $state('mostrecent')
let sortOrder = $state('desc')
let currentSortColumn = $state('created')

let records = $state<FilteredRecord[]>([])
let totalRecords = $state(0)
let pageNumber = $state(1)
let size = $state(10)
let maxPages = $state(1)
let totalPages = $derived(Math.min(maxPages, Math.ceil(totalRecords / size)))
let isNavigating = $state(false)
let isSearching = $state(false)
let searchAbortController: AbortController | null = null

const pageSizeOptions = [10, 20, 30, 50, 100]

onMount(() => {
	const urlParams = new URLSearchParams(window.location.search)
	const urlPage = urlParams.get('page')
	const urlSort = urlParams.get('sort')
	const urlSize = urlParams.get('size')
	const urlTitle = urlParams.get('title')

	// If no URL parameters, try to load from localStorage
	if (!urlPage && !urlSort && !urlSize && !urlTitle) {
		const savedState = loadRecordsState()
		if (savedState) {
			filterName = savedState.filterName || ''
			sortBy = savedState.sortBy || 'mostrecent'
			pageNumber = savedState.pageNumber || 1
			size = savedState.size || 10

			// Navigate to the saved state
			loadRecords()
			return
		}
	}

	// Initialize from URL parameters
	if (urlPage) pageNumber = parseInt(urlPage) || 1
	if (urlSort) sortBy = urlSort
	if (urlSize) size = parseInt(urlSize) || 10
	if (urlTitle) filterName = urlTitle

	// Load initial data
	loadRecords()
})

$effect(() => {
	;(async () => {
		const result = await data?.result
		records = result?.hits ?? []
		totalRecords = result?.total ?? 0
		// Zenodo API limits: max 100 per page, max 10000 results total
		const maxApiResults = Math.min(totalRecords, 10000)
		maxPages = Math.ceil(maxApiResults / size)
		isNavigating = false // Reset loading state when data arrives
	})()
})

async function loadRecords() {
	// Cancel any ongoing search request
	if (searchAbortController) {
		searchAbortController.abort()
	}

	// Create new abort controller for this request
	searchAbortController = new AbortController()

	// Set loading state when navigation starts
	isNavigating = true

	try {
		// construct url parameters from pageNumber, sort, size and title
		const params = new URLSearchParams()
		params.set('page', pageNumber.toString())
		sortBy && params.set('sort', sortBy)
		size && params.set('size', size.toString())
		filterName && params.set('title', filterName)

		// Update URL without reloading the page
		const newUrl = `records?${params.toString()}`
		history.replaceState({}, '', newUrl)

		// Call the load function from +page.ts directly
		const baseUrl = 'https://zenodo.org/api/records'
		const creator = 'Junior Professorship for Digital Humanities'
		const queryParts = [`metadata.creators.person_or_org.name:"${creator}"`]
		filterName && queryParts.push(`metadata.title:*${filterName}*`)
		const query = queryParts.join(' AND ')

		const apiParams = new URLSearchParams({
			q: query,
			page: pageNumber.toString(),
			size: size.toString(),
			sort: sortBy || 'bestmatch',
			type: 'dataset'
		})

		const url = `${baseUrl}?${apiParams.toString()}`
		const response = await fetch(url, {
			signal: searchAbortController.signal
		})

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`)
		}

		const result = await response.json()
		const total = result?.hits?.total
		const hits = result?.hits?.hits.map((record: any) => filterZenodoRecord(record))

		// Update the data
		records = hits
		totalRecords = total ?? 0

		// Update pagination
		const maxApiResults = Math.min(totalRecords, 10000)
		maxPages = Math.ceil(maxApiResults / size)

	} catch (error) {
		if (error instanceof Error && error.name !== 'AbortError') {
			console.error('Failed to load records:', error)
		}
	} finally {
		isNavigating = false
		searchAbortController = null
	}
}



function handleSearch() {
	// Reset to first page when searching
	pageNumber = 1
	loadRecords()
}

function handleManualSearch() {
	if (isSearching) return // Prevent multiple simultaneous searches

	isSearching = true
	handleSearch()

	// Reset search loading state after a short delay
	setTimeout(() => {
		isSearching = false
	}, 1000)
}

// Create throttled search function
const throttledSearch = throttle(handleSearch, 1000)

function handleRecordNavigation(recordId: string) {
	// Save current state before navigating to record
	saveRecordsState({
		filterName,
		sortBy,
		pageNumber,
		size
	})

	// Navigate to record
	goto(`/records/${recordId}`)
}

function handleSort(column: string) {
	if (currentSortColumn === column) {
		// Toggle sort order if same column
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
	} else {
		// Set new column and default to desc for dates, asc for others
		currentSortColumn = column
		sortOrder = column === 'created' ? 'desc' : 'asc'
	}

	// Map column to Zenodo API sort parameter
	switch (column) {
		case 'created':
			sortBy = sortOrder === 'desc' ? 'mostrecent' : 'bestmatch'
			break
		case 'title':
			// Zenodo doesn't have title sorting, use bestmatch
			sortBy = 'bestmatch'
			break
		case 'downloads':
			sortBy = 'mostdownloaded'
			break
		case 'views':
			sortBy = 'mostviewed'
			break
		default:
			sortBy = 'mostrecent'
	}

	// Reset to first page when sorting changes
	pageNumber = 1
	loadRecords()
}

function handlePageSizeChange(event: Event) {
	const target = event.target as HTMLSelectElement
	size = parseInt(target.value)
	pageNumber = 1 // Reset to first page
	loadRecords()
}
</script>

<svelte:head>
	<title>Cultural Heritage Records - 3DBigDataSpace</title>
	<meta name="description"
	      content="Browse and explore Europe's cultural heritage artifacts in 3D. Discover interactive 3D models, historical buildings, and cultural treasures with AR support." />
	<meta property="og:title" content="Cultural Heritage Records - 3DBigDataSpace" />
	<meta property="og:description"
	      content="Browse and explore Europe's cultural heritage artifacts in 3D. Discover interactive 3D models, historical buildings, and cultural treasures with AR support." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Cultural Heritage Records - 3DBigDataSpace" />
	<meta name="twitter:description"
	      content="Browse and explore Europe's cultural heritage artifacts in 3D. Discover interactive 3D models, historical buildings, and cultural treasures with AR support." />
</svelte:head>

<Header />

<div class="relative flex flex-auto flex-col overflow-hidden p-4 md:p-8 text-slate-500">
	<!-- table -->
	<div class="flex flex-auto flex-col overflow-hidden rounded">
		<!-- header -->
		<div class="bg-slate-100 px-3 py-2">
			<!-- Search and page size controls -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-2">
				<div class="flex-auto flex gap-2">
					<input
						type="text"
						class="_dark:bg-gray-800 h-9 w-full max-w-80 rounded-sm border border-transparent bg-white transition-all outline-none focus:ring-0"
						placeholder="Search"
						oninput={(e: Event) => {
							const target = e.target as HTMLInputElement
							filterName = target.value
							throttledSearch()
						}}
						bind:value={filterName}
					/>
					<button
						type="button"
						class="h-9 px-3 rounded-sm bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white transition-colors flex items-center justify-center min-w-[36px] cursor-pointer"
						onclick={handleManualSearch}
						disabled={isSearching}
						title="Search"
					>
						{#if isSearching}
							<Icon icon="tabler:loader-2" class="size-4 animate-spin" />
						{:else}
							<Icon icon="tabler:search" class="size-4" />
						{/if}
					</button>
				</div>
				<div class="flex items-center gap-2">
					<label for="pageSize" class="text-sm text-slate-600">Show:</label>
					<select
						id="pageSize"
						class="h-9 rounded-sm border border-slate-300 bg-white pl-2 pr-8 text-sm cursor-pointer"
						bind:value={size}
						onchange={handlePageSizeChange}
					>
						{#each pageSizeOptions as option}
							<option value={option} selected={option === 10}>{option}</option>
						{/each}
					</select>
					<span class="text-sm text-slate-600">entries</span>
				</div>
			</div>

			<!-- Column headers -->
			<div class="flex items-center gap-3 font-semibold text-slate-700 uppercase text-sm">
				<div class="w-16 sm:w-20 flex-none">Thumbnail</div>
				<button
					class="flex-auto flex items-center gap-1 hover:text-slate-900 transition-colors text-left"
					onclick={() => handleSort('title')}
				>
					Title
					{#if currentSortColumn === 'title'}
						<Icon
							icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'}
							class="size-4"
						/>
					{:else}
						<Icon icon="tabler:selector" class="size-4 opacity-50" />
					{/if}
				</button>
				<button
					class="w-20 sm:w-24 flex-none flex items-center gap-1 hover:text-slate-900 transition-colors hidden sm:flex"
					onclick={() => handleSort('status')}
				>
					Status
					{#if currentSortColumn === 'status'}
						<Icon
							icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'}
							class="size-4"
						/>
					{:else}
						<Icon icon="tabler:selector" class="size-4 opacity-50" />
					{/if}
				</button>
				<button
					class="w-24 sm:w-32 flex-none flex items-center gap-1 hover:text-slate-900 transition-colors hidden sm:flex"
					onclick={() => handleSort('created')}
				>
					Created
					{#if currentSortColumn === 'created'}
						<Icon
							icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'}
							class="size-4"
						/>
					{:else}
						<Icon icon="tabler:selector" class="size-4 opacity-50" />
					{/if}
				</button>
				<button
					class="w-8 sm:w-12 flex-none flex items-center justify-center gap-1 hover:text-slate-900 transition-colors hidden md:flex"
					onclick={() => handleSort('views')}
					title="Sort by views"
				>
					<Icon icon="tabler:eye" class="size-4" />
					{#if currentSortColumn === 'views'}
						<Icon
							icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'}
							class="size-3"
						/>
					{/if}
				</button>
				<button
					class="w-8 sm:w-12 flex-none flex items-center justify-center gap-1 hover:text-slate-900 transition-colors hidden md:flex"
					onclick={() => handleSort('downloads')}
					title="Sort by downloads"
				>
					<Icon icon="tabler:download" class="size-4" />
					{#if currentSortColumn === 'downloads'}
						<Icon
							icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'}
							class="size-3"
						/>
					{/if}
				</button>
			</div>
		</div>

		<!-- rows -->
		<div class="bg-white_ flex-auto overflow-y-auto relative">
			{#if isNavigating}
				<!-- Navigation loading overlay -->
				<div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
					<Icon icon="tabler:loader-2" class="size-8 animate-spin text-slate-600 mb-2" />
					<span class="text-sm text-slate-600">Loading new page...</span>
				</div>
			{/if}
			
			{#await result}
				<div class="flex h-full flex-col items-center justify-center">
					<Icon icon="tabler:loader-2" class="size-12 animate-spin" />
					<span class="">Loading...</span>
				</div>
			{:then test}
				<ul
					class="flex flex-col *:border-b *:border-slate-200 *:px-4 *:py-3 *:hover:bg-slate-100 {isNavigating ? 'opacity-50' : ''}"
				>
					{#each records as record (record.id)}
						<li>
							<button
								onclick={() => handleRecordNavigation(record.id)}
								class="flex w-full items-center gap-3 overflow-hidden text-left"
							>
								<div class="w-16 sm:w-20 flex-none">
									<CachedThumbnail
										src={record.bestThumbnail || `https://zenodo.org/record/${record.id}/thumb100`}
										alt={record.title}
										class="size-16 sm:size-20 rounded object-contain bg-gradient-to-br from-slate-50 to-slate-100 p-1"
									/>
								</div>
								<div class="flex-auto truncate font-medium text-slate-900 pr-2">{record.title}</div>
								<div class="w-20 sm:w-24 flex-none hidden sm:block">
									<span
										class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
										{record.status}
									</span>
								</div>
								<div class="w-24 sm:w-32 flex-none text-sm text-slate-600 hidden sm:block">
									{formatDate(record.created)}
								</div>
								<div class="w-8 sm:w-12 flex-none text-sm text-slate-600 text-center hidden md:block">
									{record.stats?.views ?? 0}
								</div>
								<div class="w-8 sm:w-12 flex-none text-sm text-slate-600 text-center hidden md:block">
									{record.stats?.downloads ?? 0}
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{/await}
		</div>

		<!-- pagination -->
		<div class="flex flex-col sm:flex-row items-center justify-between bg-slate-100 px-3 py-2 text-slate-700 gap-2">
			<p class="text-sm text-center sm:text-left">
				Showing {(pageNumber - 1) * size + 1} - {Math.min(pageNumber * size, totalRecords)}
				of {totalRecords} records
				{#if totalRecords > 10000}
					<span class="text-sm text-orange-600 block sm:inline">(API limited to first 10,000 results)</span>
				{/if}
			</p>
			<div class="flex items-center">
				<button
					class="disabled:text-opacity-50 inline-flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-slate-200 disabled:cursor-not-allowed hover:disabled:bg-transparent cursor-pointer"
					disabled={pageNumber <= 1 || isNavigating}
					onclick={() => {
						pageNumber = pageNumber - 1
						loadRecords()
					}}
				>
					<Icon icon="tabler:chevron-left" class="size-5" />
				</button>
				<span class="mx-4 flex items-center gap-2 text-sm sm:text-base">
					Page {pageNumber} of {totalPages}
					{#if isNavigating}
						<Icon icon="tabler:loader-2" class="size-4 animate-spin text-slate-500" />
					{/if}
				</span>
				<button
					class="disabled:text-opacity-50 inline-flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-slate-200 disabled:cursor-not-allowed hover:disabled:bg-transparent cursor-pointer"
					disabled={pageNumber >= totalPages || isNavigating}
					onclick={() => {
						pageNumber = pageNumber + 1
						loadRecords()
					}}
				>
					<Icon icon="tabler:chevron-right" class="size-5" />
				</button>
			</div>
		</div>
	</div>
	<!-- end table -->
</div>

<Footer />
