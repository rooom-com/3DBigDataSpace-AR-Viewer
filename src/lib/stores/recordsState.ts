export interface RecordsState {
	filterName: string
	sortBy: string
	pageNumber: number
	size: number
	scrollPosition?: number
}

const STORAGE_KEY = 'records-page-state'

export function saveRecordsState(state: RecordsState): void {
	try {
		const stateWithScroll = {
			...state,
			scrollPosition: window.scrollY
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithScroll))
	} catch (error) {
		console.warn('Failed to save records state to localStorage:', error)
	}
}

export function loadRecordsState(): RecordsState | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			return JSON.parse(stored)
		}
	} catch (error) {
		console.warn('Failed to load records state from localStorage:', error)
	}
	return null
}

export function clearRecordsState(): void {
	try {
		localStorage.removeItem(STORAGE_KEY)
	} catch (error) {
		console.warn('Failed to clear records state from localStorage:', error)
	}
}

export function buildRecordsUrl(state: RecordsState): string {
	const params = new URLSearchParams()
	
	if (state.pageNumber > 1) {
		params.set('page', state.pageNumber.toString())
	}
	if (state.sortBy && state.sortBy !== 'mostrecent') {
		params.set('sort', state.sortBy)
	}
	if (state.size !== 30) {
		params.set('size', state.size.toString())
	}
	if (state.filterName) {
		params.set('title', state.filterName)
	}

	const queryString = params.toString()
	return queryString ? `/records?${queryString}` : '/records'
}

export function navigateBackToRecords(): string {
	const savedState = loadRecordsState()
	if (savedState) {
		return buildRecordsUrl(savedState)
	}
	return '/records'
}
