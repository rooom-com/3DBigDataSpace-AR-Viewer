import { filterZenodoRecord } from '$lib/utils'
import type { PageServerLoad } from './$types'

export const load = (async ({ params, fetch }) => {
	const { id } = params

	const url = `https://zenodo.org/api/records/${id}`

	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`)
		}
		const result = await response.json()
		const record = filterZenodoRecord(result)

		return {
			result: record
		}
	} catch (error) {
		return { error: `${(error as Error).message}` }
	}
}) satisfies PageServerLoad
