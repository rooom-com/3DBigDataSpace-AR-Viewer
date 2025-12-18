import { error } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'

/**
 * Proxy endpoint to fetch external resources and avoid CORS issues
 * Supports fetching METS XML files and IIIF manifests from Zenodo
 */
export async function GET({ url, fetch }: RequestEvent) {
	const targetUrl = url.searchParams.get('url')

	if (!targetUrl) {
		throw error(400, 'Missing url parameter')
	}

	// Validate that the URL is from an allowed domain
	const allowedDomains = [
		'zenodo.org',
		'iiif.zenodo.org'
	]

	let parsedUrl: URL
	try {
		parsedUrl = new URL(targetUrl)
	} catch {
		throw error(400, 'Invalid URL')
	}

	const isAllowed = allowedDomains.some(domain => 
		parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
	)

	if (!isAllowed) {
		throw error(403, `Domain ${parsedUrl.hostname} is not allowed`)
	}

	try {
		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent': '3DBigDataSpace/1.0'
			}
		})

		if (!response.ok) {
			// Consolidate logging - only log server errors and in development mode
			if (response.status >= 500) {
				console.error(`Proxy error ${response.status} fetching ${parsedUrl.hostname}: ${response.statusText}`)
			} else if (import.meta.env.DEV && response.status === 404) {
				console.warn(`Proxy: Resource not found at ${parsedUrl.hostname}`)
			}
			throw error(response.status, `Failed to fetch resource: ${response.statusText}`)
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream'
		const content = await response.text()

		return new Response(content, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
				'Access-Control-Allow-Origin': '*'
			}
		})
	} catch (err) {
		// Only log unexpected errors (not HTTP errors which are already logged above)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err
		}
		console.error(`Proxy error fetching ${parsedUrl.hostname}:`, err instanceof Error ? err.message : err)
		throw error(500, `Failed to fetch resource: ${err instanceof Error ? err.message : 'Unknown error'}`)
	}
}

