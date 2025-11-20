import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, fetch }) => {
	const targetUrl = url.searchParams.get('url')

	if (!targetUrl) {
		return new Response('Missing url parameter', { status: 400 })
	}

	// Only allow Zenodo URLs for security
	const allowedDomains = [
		'https://zenodo.org/',
		'https://iiif.zenodo.org/'
	]

	if (!allowedDomains.some(domain => targetUrl.startsWith(domain))) {
		return new Response('Only Zenodo URLs are allowed', { status: 403 })
	}

	try {
		const response = await fetch(targetUrl)
		
		if (!response.ok) {
			return new Response(`Failed to fetch: ${response.status}`, { status: response.status })
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream'
		const data = await response.text()

		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'public, max-age=3600'
			}
		})
	} catch (error) {
		console.error('Proxy error:', error)
		return new Response(`Proxy error: ${error}`, { status: 500 })
	}
}

