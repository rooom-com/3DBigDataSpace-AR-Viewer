export interface METSRecord {
	id: string
	title: string
	creator?: string
	glbUrl?: string
	thumbnailUrl?: string
	description?: string
	license?: string
	created?: string
	updated?: string
}

export interface IIIFAnnotation {
	id: string
	type: 'Annotation'
	motivation: string[]
	body?: IIIFAnnotationBody | string
	bodyValue?: string
	target: IIIFAnnotationTarget
}

export interface IIIFAnnotationBody {
	type?: string
	value?: string
	format?: string
	language?: string
	position?: IIIFAnnotationTarget
}

export interface IIIFAnnotationTarget {
	type: 'SpecificResource'
	source: Array<{
		id: string
		type: string
	}>
	selector: IIIFSelector[]
}

export interface IIIFSelector {
	type: 'PointSelector' | 'WKTSelector'
	x?: number
	y?: number
	z?: number
	value?: string // For WKT polygons
}

export interface IIIFManifest {
	'@context': string
	id: string
	type: 'Manifest'
	label: Record<string, string[]>
	summary?: Record<string, string[]>
	items: IIIFScene[]
}

export interface IIIFScene {
	id: string
	type: 'Scene'
	label: Record<string, string[]>
	items: IIIFAnnotationPage[]
}

export interface IIIFAnnotationPage {
	id: string
	type: 'AnnotationPage'
	items: IIIFAnnotation[]
}

/**
 * Helper function to fetch external resources through proxy to avoid CORS issues
 */
async function fetchThroughProxy(url: string, retries = 3): Promise<Response> {
	const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`

	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			const response = await fetch(proxyUrl)
			if (response.ok) {
				return response
			}

			// If not the last attempt and got a server error, retry
			if (attempt < retries - 1 && response.status >= 500) {
				const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
				await new Promise(resolve => setTimeout(resolve, delay))
				continue
			}

			throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
		} catch (error) {
			if (attempt === retries - 1) {
				throw error
			}
			// Wait before retry
			const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
			await new Promise(resolve => setTimeout(resolve, delay))
		}
	}

	throw new Error('Failed to fetch after retries')
}

export async function parseMETSXML(xmlUrl: string): Promise<METSRecord | null> {
	try {
		const response = await fetchThroughProxy(xmlUrl)
		if (!response.ok) {
			throw new Error(`Failed to fetch XML: ${response.status}`)
		}

		const xmlText = await response.text()
		const parser = new DOMParser()
		const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

		const parserError = xmlDoc.querySelector('parsererror')
		if (parserError) {
			throw new Error('XML parsing error: ' + parserError.textContent)
		}

		const record: METSRecord = {
			id: extractTextContent(xmlDoc, 'mods\\:recordIdentifier, recordIdentifier') || 'unknown',
			title: extractTextContent(xmlDoc, 'mods\\:title, title') || 'Untitled',
			creator: extractTextContent(xmlDoc, 'mods\\:displayForm, displayForm') || undefined,
			description: extractTextContent(xmlDoc, 'mods\\:recordInfoNote, recordInfoNote') || undefined,
			license: extractTextContent(xmlDoc, 'mods\\:accessCondition, accessCondition') || undefined,
			created: extractTextContent(xmlDoc, 'mods\\:dateCreated, dateCreated') || undefined,
			updated: extractTextContent(xmlDoc, 'mods\\:dateIssued, dateIssued') || undefined
		}

		const glbFile = xmlDoc.querySelector('mets\\:file[MIMETYPE="model/gltf-binary"], file[MIMETYPE="model/gltf-binary"]')
		if (glbFile) {
			const fLocat = glbFile.querySelector('mets\\:FLocat, FLocat')
			if (fLocat) {
				const href = fLocat.getAttribute('xlink:href') || fLocat.getAttribute('href')
				record.glbUrl = href || undefined
			}
		}

		const thumbFile = xmlDoc.querySelector('mets\\:file[MIMETYPE="image/jpeg"], file[MIMETYPE="image/jpeg"]')
		if (thumbFile) {
			const fLocat = thumbFile.querySelector('mets\\:FLocat, FLocat')
			if (fLocat) {
				const href = fLocat.getAttribute('xlink:href') || fLocat.getAttribute('href')
				record.thumbnailUrl = href || undefined
			}
		}

		return record
	} catch (error) {
		console.error('Failed to parse METS XML:', error instanceof Error ? error.message : error)
		return null
	}
}

/**
 * Parse a IIIF Presentation API manifest from a URL
 * Note: This function can be used with custom IIIF manifests hosted externally.
 * Zenodo does not provide IIIF endpoints, so this will only work with
 * user-provided manifest URLs or custom IIIF servers.
 */
export async function parseIIIFManifest(manifestUrl: string): Promise<IIIFManifest | null> {
	try {
		const response = await fetchThroughProxy(manifestUrl)
		if (!response.ok) {
			throw new Error(`Failed to fetch IIIF manifest: ${response.status}`)
		}

		const manifest = await response.json() as IIIFManifest
		return manifest
	} catch (error) {
		console.error('Failed to parse IIIF manifest:', error instanceof Error ? error.message : error)
		return null
	}
}

export function extractCommentingAnnotations(manifest: IIIFManifest): IIIFAnnotation[] {
	const annotations: IIIFAnnotation[] = []

	for (const scene of manifest.items) {
		for (const page of scene.items) {
			for (const annotation of page.items) {
				if (annotation.motivation.includes('commenting')) {
					annotations.push(annotation)
				}
			}
		}
	}

	return annotations
}

export function createSampleAnnotations(modelUrl: string): IIIFAnnotation[] {
	return [
		{
			id: 'reliquary-annotation-1',
			type: 'Annotation',
			motivation: ['commenting'],
			bodyValue: 'Reliquary Bust - This is a medieval reliquary in the form of a bust, likely containing sacred relics.',
			target: {
				type: 'SpecificResource',
				source: [{
					id: 'scene1',
					type: 'Scene'
				}],
				selector: [{
					type: 'PointSelector',
					x: 0.0,
					y: 0.15,
					z: 0.0
				}]
			}
		},
		{
			id: 'reliquary-annotation-2',
			type: 'Annotation',
			motivation: ['commenting'],
			body: {
				type: 'TextualBody',
				value: '<p><strong>Head and Crown:</strong> The ornate crown and facial features show typical medieval craftsmanship and religious iconography.</p>',
				format: 'text/html',
				language: 'en'
			},
			target: {
				type: 'SpecificResource',
				source: [{
					id: 'scene1',
					type: 'Scene'
				}],
				selector: [{
					type: 'PointSelector',
					x: 0.0,
					y: 0.25,
					z: 0.0
				}]
			}
		},
		{
			id: 'reliquary-annotation-3',
			type: 'Annotation',
			motivation: ['commenting'],
			bodyValue: 'Base Structure - The base of the reliquary shows decorative elements typical of medieval religious art.',
			target: {
				type: 'SpecificResource',
				source: [{
					id: 'scene1',
					type: 'Scene'
				}],
				selector: [{
					type: 'PointSelector',
					x: 0.0,
					y: 0.05,
					z: 0.0
				}]
			}
		}
	]
}

export async function loadIIIFAnnotationsForRecord(recordId: string): Promise<IIIFAnnotation[]> {
	// NOTE: Zenodo does not currently provide IIIF manifests for records.
	// The IIIF Presentation API is not part of Zenodo's infrastructure.
	// This function is kept for future compatibility if Zenodo adds IIIF support,
	// or if custom IIIF manifests are uploaded as files to Zenodo records.

	try {
		// Check if a IIIF manifest file exists in the Zenodo record's files
		// This would require fetching the record metadata and checking for .json files
		// that follow IIIF Presentation API structure

		// For now, we return an empty array since Zenodo doesn't provide IIIF endpoints
		// Only log in development mode to reduce production console noise
		if (import.meta.env.DEV) {
			console.info(`IIIF manifests not available from Zenodo for record ${recordId}, using fallback annotations`)
		}
		return []
	} catch (error) {
		console.error('Failed to load IIIF annotations:', error instanceof Error ? error.message : error)
		return []
	}
}

function extractTextContent(xmlDoc: Document, selector: string): string | null {
	const selectors = selector.split(', ')
	
	for (const sel of selectors) {
		const element = xmlDoc.querySelector(sel.trim())
		if (element && element.textContent) {
			return element.textContent.trim()
		}
	}
	
	return null
}
