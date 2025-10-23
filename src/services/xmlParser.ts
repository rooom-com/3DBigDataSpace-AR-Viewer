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

export async function parseMETSXML(xmlUrl: string): Promise<METSRecord | null> {
	try {
		const response = await fetch(xmlUrl)
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
		console.error('Error parsing METS XML:', error)
		return null
	}
}

export async function parseIIIFManifest(manifestUrl: string): Promise<IIIFManifest | null> {
	try {
		const response = await fetch(manifestUrl)
		if (!response.ok) {
			throw new Error(`Failed to fetch IIIF manifest: ${response.status}`)
		}

		const manifest = await response.json() as IIIFManifest
		return manifest
	} catch (error) {
		console.error('Error parsing IIIF manifest:', error)
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
	try {
		const possibleUrls = [
			`https://zenodo.org/api/iiif/records/${recordId}/manifest.json`,
			`https://zenodo.org/records/${recordId}/manifest.json`,
			`https://iiif.zenodo.org/${recordId}/manifest.json`
		]

		for (const url of possibleUrls) {
			try {
				const manifest = await parseIIIFManifest(url)
				if (manifest) {
					return extractCommentingAnnotations(manifest)
				}
			} catch (error) {
				continue
			}
		}

		return []
	} catch (error) {
		console.error('Error loading IIIF annotations:', error)
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
